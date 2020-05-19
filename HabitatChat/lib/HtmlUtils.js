/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017, 2018 New Vector Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>
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
'use strict';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unicodeToShortcode = unicodeToShortcode;
exports.shortcodeToUnicode = shortcodeToUnicode;
exports.processHtmlForSending = processHtmlForSending;
exports.sanitizedHtmlNode = sanitizedHtmlNode;
exports.isUrlPermitted = isUrlPermitted;
exports.bodyToHtml = bodyToHtml;
exports.linkifyString = linkifyString;
exports.linkifyElement = linkifyElement;
exports.linkifyAndSanitizeHtml = linkifyAndSanitizeHtml;
exports.checkBlockNode = checkBlockNode;

var _ReplyThread = _interopRequireDefault(require("./components/views/elements/ReplyThread"));

var _react = _interopRequireDefault(require("react"));

var _sanitizeHtml = _interopRequireDefault(require("sanitize-html"));

var linkify = _interopRequireWildcard(require("linkifyjs"));

var _linkifyMatrix = _interopRequireDefault(require("./linkify-matrix"));

var _element = _interopRequireDefault(require("linkifyjs/element"));

var _string = _interopRequireDefault(require("linkifyjs/string"));

var _classnames = _interopRequireDefault(require("classnames"));

var _MatrixClientPeg = require("./MatrixClientPeg");

var _url = _interopRequireDefault(require("url"));

var _emojibaseRegex = _interopRequireDefault(require("emojibase-regex"));

var _Permalinks = require("./utils/permalinks/Permalinks");

var _emoji = require("./emoji");

(0, _linkifyMatrix.default)(linkify); // Anything outside the basic multilingual plane will be a surrogate pair

const SURROGATE_PAIR_PATTERN = /([\ud800-\udbff])([\udc00-\udfff])/; // And there a bunch more symbol characters that emojibase has within the
// BMP, so this includes the ranges from 'letterlike symbols' to
// 'miscellaneous symbols and arrows' which should catch all of them
// (with plenty of false positives, but that's OK)

const SYMBOL_PATTERN = /([\u2100-\u2bff])/; // Regex pattern for Zero-Width joiner unicode characters

const ZWJ_REGEX = new RegExp("\u200D|\u2003", "g"); // Regex pattern for whitespace characters

const WHITESPACE_REGEX = new RegExp("\\s", "g");
const BIGEMOJI_REGEX = new RegExp("^(".concat(_emojibaseRegex.default.source, ")+$"), 'i');
const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const PERMITTED_URL_SCHEMES = ['http', 'https', 'ftp', 'mailto', 'magnet'];
/*
 * Return true if the given string contains emoji
 * Uses a much, much simpler regex than emojibase's so will give false
 * positives, but useful for fast-path testing strings to see if they
 * need emojification.
 * unicodeToImage uses this function.
 */

function mightContainEmoji(str) {
  return SURROGATE_PAIR_PATTERN.test(str) || SYMBOL_PATTERN.test(str);
}
/**
 * Returns the shortcode for an emoji character.
 *
 * @param {String} char The emoji character
 * @return {String} The shortcode (such as :thumbup:)
 */


function unicodeToShortcode(char) {
  const data = (0, _emoji.getEmojiFromUnicode)(char);
  return data && data.shortcodes ? ":".concat(data.shortcodes[0], ":") : '';
}
/**
 * Returns the unicode character for an emoji shortcode
 *
 * @param {String} shortcode The shortcode (such as :thumbup:)
 * @return {String} The emoji character; null if none exists
 */


function shortcodeToUnicode(shortcode) {
  shortcode = shortcode.slice(1, shortcode.length - 1);

  const data = _emoji.SHORTCODE_TO_EMOJI.get(shortcode);

  return data ? data.unicode : null;
}

function processHtmlForSending(html
/*: string*/
)
/*: string*/
{
  const contentDiv = document.createElement('div');
  contentDiv.innerHTML = html;

  if (contentDiv.children.length === 0) {
    return contentDiv.innerHTML;
  }

  let contentHTML = "";

  for (let i = 0; i < contentDiv.children.length; i++) {
    const element = contentDiv.children[i];

    if (element.tagName.toLowerCase() === 'p') {
      contentHTML += element.innerHTML; // Don't add a <br /> for the last <p>

      if (i !== contentDiv.children.length - 1) {
        contentHTML += '<br />';
      }
    } else {
      const temp = document.createElement('div');
      temp.appendChild(element.cloneNode(true));
      contentHTML += temp.innerHTML;
    }
  }

  return contentHTML;
}
/*
 * Given an untrusted HTML string, return a React node with an sanitized version
 * of that HTML.
 */


function sanitizedHtmlNode(insaneHtml) {
  const saneHtml = (0, _sanitizeHtml.default)(insaneHtml, sanitizeHtmlParams);
  return /*#__PURE__*/_react.default.createElement("div", {
    dangerouslySetInnerHTML: {
      __html: saneHtml
    },
    dir: "auto"
  });
}
/**
 * Tests if a URL from an untrusted source may be safely put into the DOM
 * The biggest threat here is javascript: URIs.
 * Note that the HTML sanitiser library has its own internal logic for
 * doing this, to which we pass the same list of schemes. This is used in
 * other places we need to sanitise URLs.
 * @return true if permitted, otherwise false
 */


function isUrlPermitted(inputUrl) {
  try {
    const parsed = _url.default.parse(inputUrl);

    if (!parsed.protocol) return false; // URL parser protocol includes the trailing colon

    return PERMITTED_URL_SCHEMES.includes(parsed.protocol.slice(0, -1));
  } catch (e) {
    return false;
  }
}

const transformTags = {
  // custom to matrix
  // add blank targets to all hyperlinks except vector URLs
  'a': function (tagName, attribs) {
    if (attribs.href) {
      attribs.target = '_blank'; // by default

      const transformed = (0, _Permalinks.tryTransformPermalinkToLocalHref)(attribs.href);

      if (transformed !== attribs.href || attribs.href.match(_linkifyMatrix.default.VECTOR_URL_PATTERN)) {
        attribs.href = transformed;
        delete attribs.target;
      }
    }

    attribs.rel = 'noreferrer noopener'; // https://mathiasbynens.github.io/rel-noopener/

    return {
      tagName,
      attribs
    };
  },
  'img': function (tagName, attribs) {
    // Strip out imgs that aren't `mxc` here instead of using allowedSchemesByTag
    // because transformTags is used _before_ we filter by allowedSchemesByTag and
    // we don't want to allow images with `https?` `src`s.
    if (!attribs.src || !attribs.src.startsWith('mxc://')) {
      return {
        tagName,
        attribs: {}
      };
    }

    attribs.src = _MatrixClientPeg.MatrixClientPeg.get().mxcUrlToHttp(attribs.src, attribs.width || 800, attribs.height || 600);
    return {
      tagName,
      attribs
    };
  },
  'code': function (tagName, attribs) {
    if (typeof attribs.class !== 'undefined') {
      // Filter out all classes other than ones starting with language- for syntax highlighting.
      const classes = attribs.class.split(/\s/).filter(function (cl) {
        return cl.startsWith('language-');
      });
      attribs.class = classes.join(' ');
    }

    return {
      tagName,
      attribs
    };
  },
  '*': function (tagName, attribs) {
    // Delete any style previously assigned, style is an allowedTag for font and span
    // because attributes are stripped after transforming
    delete attribs.style; // Sanitise and transform data-mx-color and data-mx-bg-color to their CSS
    // equivalents

    const customCSSMapper = {
      'data-mx-color': 'color',
      'data-mx-bg-color': 'background-color' // $customAttributeKey: $cssAttributeKey

    };
    let style = "";
    Object.keys(customCSSMapper).forEach(customAttributeKey => {
      const cssAttributeKey = customCSSMapper[customAttributeKey];
      const customAttributeValue = attribs[customAttributeKey];

      if (customAttributeValue && typeof customAttributeValue === 'string' && COLOR_REGEX.test(customAttributeValue)) {
        style += cssAttributeKey + ":" + customAttributeValue + ";";
        delete attribs[customAttributeKey];
      }
    });

    if (style) {
      attribs.style = style;
    }

    return {
      tagName,
      attribs
    };
  }
};
const sanitizeHtmlParams = {
  allowedTags: ['font', // custom to matrix for IRC-style font coloring
  'del', // for markdown
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol', 'sup', 'sub', 'nl', 'li', 'b', 'i', 'u', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'span', 'img'],
  allowedAttributes: {
    // custom ones first:
    font: ['color', 'data-mx-bg-color', 'data-mx-color', 'style'],
    // custom to matrix
    span: ['data-mx-bg-color', 'data-mx-color', 'data-mx-spoiler', 'style'],
    // custom to matrix
    a: ['href', 'name', 'target', 'rel'],
    // remote target: custom to matrix
    img: ['src', 'width', 'height', 'alt', 'title'],
    ol: ['start'],
    code: ['class'] // We don't actually allow all classes, we filter them in transformTags

  },
  // Lots of these won't come up by default because we don't allow them
  selfClosing: ['img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'],
  // URL schemes we permit
  allowedSchemes: PERMITTED_URL_SCHEMES,
  allowProtocolRelative: false,
  transformTags
}; // this is the same as the above except with less rewriting

const composerSanitizeHtmlParams = Object.assign({}, sanitizeHtmlParams);
composerSanitizeHtmlParams.transformTags = {
  'code': transformTags['code'],
  '*': transformTags['*']
};

class BaseHighlighter {
  constructor(highlightClass, highlightLink) {
    this.highlightClass = highlightClass;
    this.highlightLink = highlightLink;
  }
  /**
   * apply the highlights to a section of text
   *
   * @param {string} safeSnippet The snippet of text to apply the highlights
   *     to.
   * @param {string[]} safeHighlights A list of substrings to highlight,
   *     sorted by descending length.
   *
   * returns a list of results (strings for HtmlHighligher, react nodes for
   * TextHighlighter).
   */


  applyHighlights(safeSnippet, safeHighlights) {
    let lastOffset = 0;
    let offset;
    let nodes = [];
    const safeHighlight = safeHighlights[0];

    while ((offset = safeSnippet.toLowerCase().indexOf(safeHighlight.toLowerCase(), lastOffset)) >= 0) {
      // handle preamble
      if (offset > lastOffset) {
        var subSnippet = safeSnippet.substring(lastOffset, offset);
        nodes = nodes.concat(this._applySubHighlights(subSnippet, safeHighlights));
      } // do highlight. use the original string rather than safeHighlight
      // to preserve the original casing.


      const endOffset = offset + safeHighlight.length;
      nodes.push(this._processSnippet(safeSnippet.substring(offset, endOffset), true));
      lastOffset = endOffset;
    } // handle postamble


    if (lastOffset !== safeSnippet.length) {
      subSnippet = safeSnippet.substring(lastOffset, undefined);
      nodes = nodes.concat(this._applySubHighlights(subSnippet, safeHighlights));
    }

    return nodes;
  }

  _applySubHighlights(safeSnippet, safeHighlights) {
    if (safeHighlights[1]) {
      // recurse into this range to check for the next set of highlight matches
      return this.applyHighlights(safeSnippet, safeHighlights.slice(1));
    } else {
      // no more highlights to be found, just return the unhighlighted string
      return [this._processSnippet(safeSnippet, false)];
    }
  }

}

class HtmlHighlighter extends BaseHighlighter {
  /* highlight the given snippet if required
   *
   * snippet: content of the span; must have been sanitised
   * highlight: true to highlight as a search match
   *
   * returns an HTML string
   */
  _processSnippet(snippet, highlight) {
    if (!highlight) {
      // nothing required here
      return snippet;
    }

    let span = "<span class=\"" + this.highlightClass + "\">" + snippet + "</span>";

    if (this.highlightLink) {
      span = "<a href=\"" + encodeURI(this.highlightLink) + "\">" + span + "</a>";
    }

    return span;
  }

}

class TextHighlighter extends BaseHighlighter {
  constructor(highlightClass, highlightLink) {
    super(highlightClass, highlightLink);
    this._key = 0;
  }
  /* create a <span> node to hold the given content
   *
   * snippet: content of the span
   * highlight: true to highlight as a search match
   *
   * returns a React node
   */


  _processSnippet(snippet, highlight) {
    const key = this._key++;

    let node = /*#__PURE__*/_react.default.createElement("span", {
      key: key,
      className: highlight ? this.highlightClass : null
    }, snippet);

    if (highlight && this.highlightLink) {
      node = /*#__PURE__*/_react.default.createElement("a", {
        key: key,
        href: this.highlightLink
      }, node);
    }

    return node;
  }

}
/* turn a matrix event body into html
 *
 * content: 'content' of the MatrixEvent
 *
 * highlights: optional list of words to highlight, ordered by longest word first
 *
 * opts.highlightLink: optional href to add to highlighted words
 * opts.disableBigEmoji: optional argument to disable the big emoji class.
 * opts.stripReplyFallback: optional argument specifying the event is a reply and so fallback needs removing
 * opts.returnString: return an HTML string rather than JSX elements
 * opts.forComposerQuote: optional param to lessen the url rewriting done by sanitization, for quoting into composer
 * opts.ref: React ref to attach to any React components returned (not compatible with opts.returnString)
 */


function bodyToHtml(content, highlights, opts = {}) {
  const isHtmlMessage = content.format === "org.matrix.custom.html" && content.formatted_body;
  let bodyHasEmoji = false;
  let sanitizeParams = sanitizeHtmlParams;

  if (opts.forComposerQuote) {
    sanitizeParams = composerSanitizeHtmlParams;
  }

  let strippedBody;
  let safeBody;
  let isDisplayedWithHtml; // XXX: We sanitize the HTML whilst also highlighting its text nodes, to avoid accidentally trying
  // to highlight HTML tags themselves.  However, this does mean that we don't highlight textnodes which
  // are interrupted by HTML tags (not that we did before) - e.g. foo<span/>bar won't get highlighted
  // by an attempt to search for 'foobar'.  Then again, the search query probably wouldn't work either

  try {
    if (highlights && highlights.length > 0) {
      const highlighter = new HtmlHighlighter("mx_EventTile_searchHighlight", opts.highlightLink);
      const safeHighlights = highlights.map(function (highlight) {
        return (0, _sanitizeHtml.default)(highlight, sanitizeParams);
      }); // XXX: hacky bodge to temporarily apply a textFilter to the sanitizeParams structure.

      sanitizeParams.textFilter = function (safeText) {
        return highlighter.applyHighlights(safeText, safeHighlights).join('');
      };
    }

    let formattedBody = typeof content.formatted_body === 'string' ? content.formatted_body : null;
    const plainBody = typeof content.body === 'string' ? content.body : null;
    if (opts.stripReplyFallback && formattedBody) formattedBody = _ReplyThread.default.stripHTMLReply(formattedBody);
    strippedBody = opts.stripReplyFallback ? _ReplyThread.default.stripPlainReply(plainBody) : plainBody;
    bodyHasEmoji = mightContainEmoji(isHtmlMessage ? formattedBody : plainBody); // Only generate safeBody if the message was sent as org.matrix.custom.html

    if (isHtmlMessage) {
      isDisplayedWithHtml = true;
      safeBody = (0, _sanitizeHtml.default)(formattedBody, sanitizeParams);
    }
  } finally {
    delete sanitizeParams.textFilter;
  }

  if (opts.returnString) {
    return isDisplayedWithHtml ? safeBody : strippedBody;
  }

  let emojiBody = false;

  if (!opts.disableBigEmoji && bodyHasEmoji) {
    let contentBodyTrimmed = strippedBody !== undefined ? strippedBody.trim() : ''; // Ignore spaces in body text. Emojis with spaces in between should
    // still be counted as purely emoji messages.

    contentBodyTrimmed = contentBodyTrimmed.replace(WHITESPACE_REGEX, ''); // Remove zero width joiner characters from emoji messages. This ensures
    // that emojis that are made up of multiple unicode characters are still
    // presented as large.

    contentBodyTrimmed = contentBodyTrimmed.replace(ZWJ_REGEX, '');
    const match = BIGEMOJI_REGEX.exec(contentBodyTrimmed);
    emojiBody = match && match[0] && match[0].length === contentBodyTrimmed.length && ( // Prevent user pills expanding for users with only emoji in
    // their username. Permalinks (links in pills) can be any URL
    // now, so we just check for an HTTP-looking thing.
    strippedBody === safeBody || // replies have the html fallbacks, account for that here
    content.formatted_body === undefined || !content.formatted_body.includes("http:") && !content.formatted_body.includes("https:"));
  }

  const className = (0, _classnames.default)({
    'mx_EventTile_body': true,
    'mx_EventTile_bigEmoji': emojiBody,
    'markdown-body': isHtmlMessage && !emojiBody
  });
  return isDisplayedWithHtml ? /*#__PURE__*/_react.default.createElement("span", {
    key: "body",
    ref: opts.ref,
    className: className,
    dangerouslySetInnerHTML: {
      __html: safeBody
    },
    dir: "auto"
  }) : /*#__PURE__*/_react.default.createElement("span", {
    key: "body",
    ref: opts.ref,
    className: className,
    dir: "auto"
  }, strippedBody);
}
/**
 * Linkifies the given string. This is a wrapper around 'linkifyjs/string'.
 *
 * @param {string} str string to linkify
 * @param {object} [options] Options for linkifyString. Default: linkifyMatrix.options
 * @returns {string} Linkified string
 */


function linkifyString(str, options = _linkifyMatrix.default.options) {
  return (0, _string.default)(str, options);
}
/**
 * Linkifies the given DOM element. This is a wrapper around 'linkifyjs/element'.
 *
 * @param {object} element DOM element to linkify
 * @param {object} [options] Options for linkifyElement. Default: linkifyMatrix.options
 * @returns {object}
 */


function linkifyElement(element, options = _linkifyMatrix.default.options) {
  return (0, _element.default)(element, options);
}
/**
 * Linkify the given string and sanitize the HTML afterwards.
 *
 * @param {string} dirtyHtml The HTML string to sanitize and linkify
 * @param {object} [options] Options for linkifyString. Default: linkifyMatrix.options
 * @returns {string}
 */


function linkifyAndSanitizeHtml(dirtyHtml, options = _linkifyMatrix.default.options) {
  return (0, _sanitizeHtml.default)(linkifyString(dirtyHtml, options), sanitizeHtmlParams);
}
/**
 * Returns if a node is a block element or not.
 * Only takes html nodes into account that are allowed in matrix messages.
 *
 * @param {Node} node
 * @returns {bool}
 */


function checkBlockNode(node) {
  switch (node.nodeName) {
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6":
    case "PRE":
    case "BLOCKQUOTE":
    case "DIV":
    case "P":
    case "UL":
    case "OL":
    case "LI":
    case "HR":
    case "TABLE":
    case "THEAD":
    case "TBODY":
    case "TR":
    case "TH":
    case "TD":
      return true;

    default:
      return false;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9IdG1sVXRpbHMuanMiXSwibmFtZXMiOlsibGlua2lmeSIsIlNVUlJPR0FURV9QQUlSX1BBVFRFUk4iLCJTWU1CT0xfUEFUVEVSTiIsIlpXSl9SRUdFWCIsIlJlZ0V4cCIsIldISVRFU1BBQ0VfUkVHRVgiLCJCSUdFTU9KSV9SRUdFWCIsIkVNT0pJQkFTRV9SRUdFWCIsInNvdXJjZSIsIkNPTE9SX1JFR0VYIiwiUEVSTUlUVEVEX1VSTF9TQ0hFTUVTIiwibWlnaHRDb250YWluRW1vamkiLCJzdHIiLCJ0ZXN0IiwidW5pY29kZVRvU2hvcnRjb2RlIiwiY2hhciIsImRhdGEiLCJzaG9ydGNvZGVzIiwic2hvcnRjb2RlVG9Vbmljb2RlIiwic2hvcnRjb2RlIiwic2xpY2UiLCJsZW5ndGgiLCJTSE9SVENPREVfVE9fRU1PSkkiLCJnZXQiLCJ1bmljb2RlIiwicHJvY2Vzc0h0bWxGb3JTZW5kaW5nIiwiaHRtbCIsImNvbnRlbnREaXYiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJjaGlsZHJlbiIsImNvbnRlbnRIVE1MIiwiaSIsImVsZW1lbnQiLCJ0YWdOYW1lIiwidG9Mb3dlckNhc2UiLCJ0ZW1wIiwiYXBwZW5kQ2hpbGQiLCJjbG9uZU5vZGUiLCJzYW5pdGl6ZWRIdG1sTm9kZSIsImluc2FuZUh0bWwiLCJzYW5lSHRtbCIsInNhbml0aXplSHRtbFBhcmFtcyIsIl9faHRtbCIsImlzVXJsUGVybWl0dGVkIiwiaW5wdXRVcmwiLCJwYXJzZWQiLCJ1cmwiLCJwYXJzZSIsInByb3RvY29sIiwiaW5jbHVkZXMiLCJlIiwidHJhbnNmb3JtVGFncyIsImF0dHJpYnMiLCJocmVmIiwidGFyZ2V0IiwidHJhbnNmb3JtZWQiLCJtYXRjaCIsImxpbmtpZnlNYXRyaXgiLCJWRUNUT1JfVVJMX1BBVFRFUk4iLCJyZWwiLCJzcmMiLCJzdGFydHNXaXRoIiwiTWF0cml4Q2xpZW50UGVnIiwibXhjVXJsVG9IdHRwIiwid2lkdGgiLCJoZWlnaHQiLCJjbGFzcyIsImNsYXNzZXMiLCJzcGxpdCIsImZpbHRlciIsImNsIiwiam9pbiIsInN0eWxlIiwiY3VzdG9tQ1NTTWFwcGVyIiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJjdXN0b21BdHRyaWJ1dGVLZXkiLCJjc3NBdHRyaWJ1dGVLZXkiLCJjdXN0b21BdHRyaWJ1dGVWYWx1ZSIsImFsbG93ZWRUYWdzIiwiYWxsb3dlZEF0dHJpYnV0ZXMiLCJmb250Iiwic3BhbiIsImEiLCJpbWciLCJvbCIsImNvZGUiLCJzZWxmQ2xvc2luZyIsImFsbG93ZWRTY2hlbWVzIiwiYWxsb3dQcm90b2NvbFJlbGF0aXZlIiwiY29tcG9zZXJTYW5pdGl6ZUh0bWxQYXJhbXMiLCJhc3NpZ24iLCJCYXNlSGlnaGxpZ2h0ZXIiLCJjb25zdHJ1Y3RvciIsImhpZ2hsaWdodENsYXNzIiwiaGlnaGxpZ2h0TGluayIsImFwcGx5SGlnaGxpZ2h0cyIsInNhZmVTbmlwcGV0Iiwic2FmZUhpZ2hsaWdodHMiLCJsYXN0T2Zmc2V0Iiwib2Zmc2V0Iiwibm9kZXMiLCJzYWZlSGlnaGxpZ2h0IiwiaW5kZXhPZiIsInN1YlNuaXBwZXQiLCJzdWJzdHJpbmciLCJjb25jYXQiLCJfYXBwbHlTdWJIaWdobGlnaHRzIiwiZW5kT2Zmc2V0IiwicHVzaCIsIl9wcm9jZXNzU25pcHBldCIsInVuZGVmaW5lZCIsIkh0bWxIaWdobGlnaHRlciIsInNuaXBwZXQiLCJoaWdobGlnaHQiLCJlbmNvZGVVUkkiLCJUZXh0SGlnaGxpZ2h0ZXIiLCJfa2V5Iiwia2V5Iiwibm9kZSIsImJvZHlUb0h0bWwiLCJjb250ZW50IiwiaGlnaGxpZ2h0cyIsIm9wdHMiLCJpc0h0bWxNZXNzYWdlIiwiZm9ybWF0IiwiZm9ybWF0dGVkX2JvZHkiLCJib2R5SGFzRW1vamkiLCJzYW5pdGl6ZVBhcmFtcyIsImZvckNvbXBvc2VyUXVvdGUiLCJzdHJpcHBlZEJvZHkiLCJzYWZlQm9keSIsImlzRGlzcGxheWVkV2l0aEh0bWwiLCJoaWdobGlnaHRlciIsIm1hcCIsInRleHRGaWx0ZXIiLCJzYWZlVGV4dCIsImZvcm1hdHRlZEJvZHkiLCJwbGFpbkJvZHkiLCJib2R5Iiwic3RyaXBSZXBseUZhbGxiYWNrIiwiUmVwbHlUaHJlYWQiLCJzdHJpcEhUTUxSZXBseSIsInN0cmlwUGxhaW5SZXBseSIsInJldHVyblN0cmluZyIsImVtb2ppQm9keSIsImRpc2FibGVCaWdFbW9qaSIsImNvbnRlbnRCb2R5VHJpbW1lZCIsInRyaW0iLCJyZXBsYWNlIiwiZXhlYyIsImNsYXNzTmFtZSIsInJlZiIsImxpbmtpZnlTdHJpbmciLCJvcHRpb25zIiwibGlua2lmeUVsZW1lbnQiLCJsaW5raWZ5QW5kU2FuaXRpemVIdG1sIiwiZGlydHlIdG1sIiwiY2hlY2tCbG9ja05vZGUiLCJub2RlTmFtZSJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFFQSw0QkFBY0EsT0FBZCxFLENBRUE7O0FBQ0EsTUFBTUMsc0JBQXNCLEdBQUcsb0NBQS9CLEMsQ0FDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxNQUFNQyxjQUFjLEdBQUcsbUJBQXZCLEMsQ0FFQTs7QUFDQSxNQUFNQyxTQUFTLEdBQUcsSUFBSUMsTUFBSixDQUFXLGVBQVgsRUFBNEIsR0FBNUIsQ0FBbEIsQyxDQUVBOztBQUNBLE1BQU1DLGdCQUFnQixHQUFHLElBQUlELE1BQUosQ0FBVyxLQUFYLEVBQWtCLEdBQWxCLENBQXpCO0FBRUEsTUFBTUUsY0FBYyxHQUFHLElBQUlGLE1BQUosYUFBZ0JHLHdCQUFnQkMsTUFBaEMsVUFBNkMsR0FBN0MsQ0FBdkI7QUFFQSxNQUFNQyxXQUFXLEdBQUcsbUJBQXBCO0FBRUEsTUFBTUMscUJBQXFCLEdBQUcsQ0FBQyxNQUFELEVBQVMsT0FBVCxFQUFrQixLQUFsQixFQUF5QixRQUF6QixFQUFtQyxRQUFuQyxDQUE5QjtBQUVBOzs7Ozs7OztBQU9BLFNBQVNDLGlCQUFULENBQTJCQyxHQUEzQixFQUFnQztBQUM1QixTQUFPWCxzQkFBc0IsQ0FBQ1ksSUFBdkIsQ0FBNEJELEdBQTVCLEtBQW9DVixjQUFjLENBQUNXLElBQWYsQ0FBb0JELEdBQXBCLENBQTNDO0FBQ0g7QUFFRDs7Ozs7Ozs7QUFNTyxTQUFTRSxrQkFBVCxDQUE0QkMsSUFBNUIsRUFBa0M7QUFDckMsUUFBTUMsSUFBSSxHQUFHLGdDQUFvQkQsSUFBcEIsQ0FBYjtBQUNBLFNBQVFDLElBQUksSUFBSUEsSUFBSSxDQUFDQyxVQUFiLGNBQThCRCxJQUFJLENBQUNDLFVBQUwsQ0FBZ0IsQ0FBaEIsQ0FBOUIsU0FBc0QsRUFBOUQ7QUFDSDtBQUVEOzs7Ozs7OztBQU1PLFNBQVNDLGtCQUFULENBQTRCQyxTQUE1QixFQUF1QztBQUMxQ0EsRUFBQUEsU0FBUyxHQUFHQSxTQUFTLENBQUNDLEtBQVYsQ0FBZ0IsQ0FBaEIsRUFBbUJELFNBQVMsQ0FBQ0UsTUFBVixHQUFtQixDQUF0QyxDQUFaOztBQUNBLFFBQU1MLElBQUksR0FBR00sMEJBQW1CQyxHQUFuQixDQUF1QkosU0FBdkIsQ0FBYjs7QUFDQSxTQUFPSCxJQUFJLEdBQUdBLElBQUksQ0FBQ1EsT0FBUixHQUFrQixJQUE3QjtBQUNIOztBQUVNLFNBQVNDLHFCQUFULENBQStCQztBQUEvQjtBQUFBO0FBQUE7QUFBcUQ7QUFDeEQsUUFBTUMsVUFBVSxHQUFHQyxRQUFRLENBQUNDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBbkI7QUFDQUYsRUFBQUEsVUFBVSxDQUFDRyxTQUFYLEdBQXVCSixJQUF2Qjs7QUFFQSxNQUFJQyxVQUFVLENBQUNJLFFBQVgsQ0FBb0JWLE1BQXBCLEtBQStCLENBQW5DLEVBQXNDO0FBQ2xDLFdBQU9NLFVBQVUsQ0FBQ0csU0FBbEI7QUFDSDs7QUFFRCxNQUFJRSxXQUFXLEdBQUcsRUFBbEI7O0FBQ0EsT0FBSyxJQUFJQyxDQUFDLEdBQUMsQ0FBWCxFQUFjQSxDQUFDLEdBQUdOLFVBQVUsQ0FBQ0ksUUFBWCxDQUFvQlYsTUFBdEMsRUFBOENZLENBQUMsRUFBL0MsRUFBbUQ7QUFDL0MsVUFBTUMsT0FBTyxHQUFHUCxVQUFVLENBQUNJLFFBQVgsQ0FBb0JFLENBQXBCLENBQWhCOztBQUNBLFFBQUlDLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQkMsV0FBaEIsT0FBa0MsR0FBdEMsRUFBMkM7QUFDdkNKLE1BQUFBLFdBQVcsSUFBSUUsT0FBTyxDQUFDSixTQUF2QixDQUR1QyxDQUV2Qzs7QUFDQSxVQUFJRyxDQUFDLEtBQUtOLFVBQVUsQ0FBQ0ksUUFBWCxDQUFvQlYsTUFBcEIsR0FBNkIsQ0FBdkMsRUFBMEM7QUFDdENXLFFBQUFBLFdBQVcsSUFBSSxRQUFmO0FBQ0g7QUFDSixLQU5ELE1BTU87QUFDSCxZQUFNSyxJQUFJLEdBQUdULFFBQVEsQ0FBQ0MsYUFBVCxDQUF1QixLQUF2QixDQUFiO0FBQ0FRLE1BQUFBLElBQUksQ0FBQ0MsV0FBTCxDQUFpQkosT0FBTyxDQUFDSyxTQUFSLENBQWtCLElBQWxCLENBQWpCO0FBQ0FQLE1BQUFBLFdBQVcsSUFBSUssSUFBSSxDQUFDUCxTQUFwQjtBQUNIO0FBQ0o7O0FBRUQsU0FBT0UsV0FBUDtBQUNIO0FBRUQ7Ozs7OztBQUlPLFNBQVNRLGlCQUFULENBQTJCQyxVQUEzQixFQUF1QztBQUMxQyxRQUFNQyxRQUFRLEdBQUcsMkJBQWFELFVBQWIsRUFBeUJFLGtCQUF6QixDQUFqQjtBQUVBLHNCQUFPO0FBQUssSUFBQSx1QkFBdUIsRUFBRTtBQUFFQyxNQUFBQSxNQUFNLEVBQUVGO0FBQVYsS0FBOUI7QUFBb0QsSUFBQSxHQUFHLEVBQUM7QUFBeEQsSUFBUDtBQUNIO0FBRUQ7Ozs7Ozs7Ozs7QUFRTyxTQUFTRyxjQUFULENBQXdCQyxRQUF4QixFQUFrQztBQUNyQyxNQUFJO0FBQ0EsVUFBTUMsTUFBTSxHQUFHQyxhQUFJQyxLQUFKLENBQVVILFFBQVYsQ0FBZjs7QUFDQSxRQUFJLENBQUNDLE1BQU0sQ0FBQ0csUUFBWixFQUFzQixPQUFPLEtBQVAsQ0FGdEIsQ0FHQTs7QUFDQSxXQUFPeEMscUJBQXFCLENBQUN5QyxRQUF0QixDQUErQkosTUFBTSxDQUFDRyxRQUFQLENBQWdCOUIsS0FBaEIsQ0FBc0IsQ0FBdEIsRUFBeUIsQ0FBQyxDQUExQixDQUEvQixDQUFQO0FBQ0gsR0FMRCxDQUtFLE9BQU9nQyxDQUFQLEVBQVU7QUFDUixXQUFPLEtBQVA7QUFDSDtBQUNKOztBQUVELE1BQU1DLGFBQWEsR0FBRztBQUFFO0FBQ3BCO0FBQ0EsT0FBSyxVQUFTbEIsT0FBVCxFQUFrQm1CLE9BQWxCLEVBQTJCO0FBQzVCLFFBQUlBLE9BQU8sQ0FBQ0MsSUFBWixFQUFrQjtBQUNkRCxNQUFBQSxPQUFPLENBQUNFLE1BQVIsR0FBaUIsUUFBakIsQ0FEYyxDQUNhOztBQUUzQixZQUFNQyxXQUFXLEdBQUcsa0RBQWlDSCxPQUFPLENBQUNDLElBQXpDLENBQXBCOztBQUNBLFVBQUlFLFdBQVcsS0FBS0gsT0FBTyxDQUFDQyxJQUF4QixJQUFnQ0QsT0FBTyxDQUFDQyxJQUFSLENBQWFHLEtBQWIsQ0FBbUJDLHVCQUFjQyxrQkFBakMsQ0FBcEMsRUFBMEY7QUFDdEZOLFFBQUFBLE9BQU8sQ0FBQ0MsSUFBUixHQUFlRSxXQUFmO0FBQ0EsZUFBT0gsT0FBTyxDQUFDRSxNQUFmO0FBQ0g7QUFDSjs7QUFDREYsSUFBQUEsT0FBTyxDQUFDTyxHQUFSLEdBQWMscUJBQWQsQ0FWNEIsQ0FVUzs7QUFDckMsV0FBTztBQUFFMUIsTUFBQUEsT0FBRjtBQUFXbUIsTUFBQUE7QUFBWCxLQUFQO0FBQ0gsR0FkaUI7QUFlbEIsU0FBTyxVQUFTbkIsT0FBVCxFQUFrQm1CLE9BQWxCLEVBQTJCO0FBQzlCO0FBQ0E7QUFDQTtBQUNBLFFBQUksQ0FBQ0EsT0FBTyxDQUFDUSxHQUFULElBQWdCLENBQUNSLE9BQU8sQ0FBQ1EsR0FBUixDQUFZQyxVQUFaLENBQXVCLFFBQXZCLENBQXJCLEVBQXVEO0FBQ25ELGFBQU87QUFBRTVCLFFBQUFBLE9BQUY7QUFBV21CLFFBQUFBLE9BQU8sRUFBRTtBQUFwQixPQUFQO0FBQ0g7O0FBQ0RBLElBQUFBLE9BQU8sQ0FBQ1EsR0FBUixHQUFjRSxpQ0FBZ0J6QyxHQUFoQixHQUFzQjBDLFlBQXRCLENBQ1ZYLE9BQU8sQ0FBQ1EsR0FERSxFQUVWUixPQUFPLENBQUNZLEtBQVIsSUFBaUIsR0FGUCxFQUdWWixPQUFPLENBQUNhLE1BQVIsSUFBa0IsR0FIUixDQUFkO0FBS0EsV0FBTztBQUFFaEMsTUFBQUEsT0FBRjtBQUFXbUIsTUFBQUE7QUFBWCxLQUFQO0FBQ0gsR0E1QmlCO0FBNkJsQixVQUFRLFVBQVNuQixPQUFULEVBQWtCbUIsT0FBbEIsRUFBMkI7QUFDL0IsUUFBSSxPQUFPQSxPQUFPLENBQUNjLEtBQWYsS0FBeUIsV0FBN0IsRUFBMEM7QUFDdEM7QUFDQSxZQUFNQyxPQUFPLEdBQUdmLE9BQU8sQ0FBQ2MsS0FBUixDQUFjRSxLQUFkLENBQW9CLElBQXBCLEVBQTBCQyxNQUExQixDQUFpQyxVQUFTQyxFQUFULEVBQWE7QUFDMUQsZUFBT0EsRUFBRSxDQUFDVCxVQUFILENBQWMsV0FBZCxDQUFQO0FBQ0gsT0FGZSxDQUFoQjtBQUdBVCxNQUFBQSxPQUFPLENBQUNjLEtBQVIsR0FBZ0JDLE9BQU8sQ0FBQ0ksSUFBUixDQUFhLEdBQWIsQ0FBaEI7QUFDSDs7QUFDRCxXQUFPO0FBQUV0QyxNQUFBQSxPQUFGO0FBQVdtQixNQUFBQTtBQUFYLEtBQVA7QUFDSCxHQXRDaUI7QUF1Q2xCLE9BQUssVUFBU25CLE9BQVQsRUFBa0JtQixPQUFsQixFQUEyQjtBQUM1QjtBQUNBO0FBQ0EsV0FBT0EsT0FBTyxDQUFDb0IsS0FBZixDQUg0QixDQUs1QjtBQUNBOztBQUNBLFVBQU1DLGVBQWUsR0FBRztBQUNwQix1QkFBaUIsT0FERztBQUVwQiwwQkFBb0Isa0JBRkEsQ0FHcEI7O0FBSG9CLEtBQXhCO0FBTUEsUUFBSUQsS0FBSyxHQUFHLEVBQVo7QUFDQUUsSUFBQUEsTUFBTSxDQUFDQyxJQUFQLENBQVlGLGVBQVosRUFBNkJHLE9BQTdCLENBQXNDQyxrQkFBRCxJQUF3QjtBQUN6RCxZQUFNQyxlQUFlLEdBQUdMLGVBQWUsQ0FBQ0ksa0JBQUQsQ0FBdkM7QUFDQSxZQUFNRSxvQkFBb0IsR0FBRzNCLE9BQU8sQ0FBQ3lCLGtCQUFELENBQXBDOztBQUNBLFVBQUlFLG9CQUFvQixJQUNwQixPQUFPQSxvQkFBUCxLQUFnQyxRQURoQyxJQUVBeEUsV0FBVyxDQUFDSSxJQUFaLENBQWlCb0Usb0JBQWpCLENBRkosRUFHRTtBQUNFUCxRQUFBQSxLQUFLLElBQUlNLGVBQWUsR0FBRyxHQUFsQixHQUF3QkMsb0JBQXhCLEdBQStDLEdBQXhEO0FBQ0EsZUFBTzNCLE9BQU8sQ0FBQ3lCLGtCQUFELENBQWQ7QUFDSDtBQUNKLEtBVkQ7O0FBWUEsUUFBSUwsS0FBSixFQUFXO0FBQ1BwQixNQUFBQSxPQUFPLENBQUNvQixLQUFSLEdBQWdCQSxLQUFoQjtBQUNIOztBQUVELFdBQU87QUFBRXZDLE1BQUFBLE9BQUY7QUFBV21CLE1BQUFBO0FBQVgsS0FBUDtBQUNIO0FBdEVpQixDQUF0QjtBQXlFQSxNQUFNWCxrQkFBa0IsR0FBRztBQUN2QnVDLEVBQUFBLFdBQVcsRUFBRSxDQUNULE1BRFMsRUFDRDtBQUNSLE9BRlMsRUFFRjtBQUNQLE1BSFMsRUFHSCxJQUhHLEVBR0csSUFISCxFQUdTLElBSFQsRUFHZSxJQUhmLEVBR3FCLElBSHJCLEVBRzJCLFlBSDNCLEVBR3lDLEdBSHpDLEVBRzhDLEdBSDlDLEVBR21ELElBSG5ELEVBR3lELElBSHpELEVBRytELEtBSC9ELEVBR3NFLEtBSHRFLEVBSVQsSUFKUyxFQUlILElBSkcsRUFJRyxHQUpILEVBSVEsR0FKUixFQUlhLEdBSmIsRUFJa0IsUUFKbEIsRUFJNEIsSUFKNUIsRUFJa0MsUUFKbEMsRUFJNEMsTUFKNUMsRUFJb0QsSUFKcEQsRUFJMEQsSUFKMUQsRUFJZ0UsS0FKaEUsRUFLVCxPQUxTLEVBS0EsT0FMQSxFQUtTLFNBTFQsRUFLb0IsT0FMcEIsRUFLNkIsSUFMN0IsRUFLbUMsSUFMbkMsRUFLeUMsSUFMekMsRUFLK0MsS0FML0MsRUFLc0QsTUFMdEQsRUFLOEQsS0FMOUQsQ0FEVTtBQVF2QkMsRUFBQUEsaUJBQWlCLEVBQUU7QUFDZjtBQUNBQyxJQUFBQSxJQUFJLEVBQUUsQ0FBQyxPQUFELEVBQVUsa0JBQVYsRUFBOEIsZUFBOUIsRUFBK0MsT0FBL0MsQ0FGUztBQUVnRDtBQUMvREMsSUFBQUEsSUFBSSxFQUFFLENBQUMsa0JBQUQsRUFBcUIsZUFBckIsRUFBc0MsaUJBQXRDLEVBQXlELE9BQXpELENBSFM7QUFHMEQ7QUFDekVDLElBQUFBLENBQUMsRUFBRSxDQUFDLE1BQUQsRUFBUyxNQUFULEVBQWlCLFFBQWpCLEVBQTJCLEtBQTNCLENBSlk7QUFJdUI7QUFDdENDLElBQUFBLEdBQUcsRUFBRSxDQUFDLEtBQUQsRUFBUSxPQUFSLEVBQWlCLFFBQWpCLEVBQTJCLEtBQTNCLEVBQWtDLE9BQWxDLENBTFU7QUFNZkMsSUFBQUEsRUFBRSxFQUFFLENBQUMsT0FBRCxDQU5XO0FBT2ZDLElBQUFBLElBQUksRUFBRSxDQUFDLE9BQUQsQ0FQUyxDQU9FOztBQVBGLEdBUkk7QUFpQnZCO0FBQ0FDLEVBQUFBLFdBQVcsRUFBRSxDQUFDLEtBQUQsRUFBUSxJQUFSLEVBQWMsSUFBZCxFQUFvQixNQUFwQixFQUE0QixNQUE1QixFQUFvQyxVQUFwQyxFQUFnRCxPQUFoRCxFQUF5RCxNQUF6RCxFQUFpRSxNQUFqRSxDQWxCVTtBQW1CdkI7QUFDQUMsRUFBQUEsY0FBYyxFQUFFakYscUJBcEJPO0FBc0J2QmtGLEVBQUFBLHFCQUFxQixFQUFFLEtBdEJBO0FBdUJ2QnZDLEVBQUFBO0FBdkJ1QixDQUEzQixDLENBMEJBOztBQUNBLE1BQU13QywwQkFBMEIsR0FBR2pCLE1BQU0sQ0FBQ2tCLE1BQVAsQ0FBYyxFQUFkLEVBQWtCbkQsa0JBQWxCLENBQW5DO0FBQ0FrRCwwQkFBMEIsQ0FBQ3hDLGFBQTNCLEdBQTJDO0FBQ3ZDLFVBQVFBLGFBQWEsQ0FBQyxNQUFELENBRGtCO0FBRXZDLE9BQUtBLGFBQWEsQ0FBQyxHQUFEO0FBRnFCLENBQTNDOztBQUtBLE1BQU0wQyxlQUFOLENBQXNCO0FBQ2xCQyxFQUFBQSxXQUFXLENBQUNDLGNBQUQsRUFBaUJDLGFBQWpCLEVBQWdDO0FBQ3ZDLFNBQUtELGNBQUwsR0FBc0JBLGNBQXRCO0FBQ0EsU0FBS0MsYUFBTCxHQUFxQkEsYUFBckI7QUFDSDtBQUVEOzs7Ozs7Ozs7Ozs7O0FBV0FDLEVBQUFBLGVBQWUsQ0FBQ0MsV0FBRCxFQUFjQyxjQUFkLEVBQThCO0FBQ3pDLFFBQUlDLFVBQVUsR0FBRyxDQUFqQjtBQUNBLFFBQUlDLE1BQUo7QUFDQSxRQUFJQyxLQUFLLEdBQUcsRUFBWjtBQUVBLFVBQU1DLGFBQWEsR0FBR0osY0FBYyxDQUFDLENBQUQsQ0FBcEM7O0FBQ0EsV0FBTyxDQUFDRSxNQUFNLEdBQUdILFdBQVcsQ0FBQ2hFLFdBQVosR0FBMEJzRSxPQUExQixDQUFrQ0QsYUFBYSxDQUFDckUsV0FBZCxFQUFsQyxFQUErRGtFLFVBQS9ELENBQVYsS0FBeUYsQ0FBaEcsRUFBbUc7QUFDL0Y7QUFDQSxVQUFJQyxNQUFNLEdBQUdELFVBQWIsRUFBeUI7QUFDckIsWUFBSUssVUFBVSxHQUFHUCxXQUFXLENBQUNRLFNBQVosQ0FBc0JOLFVBQXRCLEVBQWtDQyxNQUFsQyxDQUFqQjtBQUNBQyxRQUFBQSxLQUFLLEdBQUdBLEtBQUssQ0FBQ0ssTUFBTixDQUFhLEtBQUtDLG1CQUFMLENBQXlCSCxVQUF6QixFQUFxQ04sY0FBckMsQ0FBYixDQUFSO0FBQ0gsT0FMOEYsQ0FPL0Y7QUFDQTs7O0FBQ0EsWUFBTVUsU0FBUyxHQUFHUixNQUFNLEdBQUdFLGFBQWEsQ0FBQ3BGLE1BQXpDO0FBQ0FtRixNQUFBQSxLQUFLLENBQUNRLElBQU4sQ0FBVyxLQUFLQyxlQUFMLENBQXFCYixXQUFXLENBQUNRLFNBQVosQ0FBc0JMLE1BQXRCLEVBQThCUSxTQUE5QixDQUFyQixFQUErRCxJQUEvRCxDQUFYO0FBRUFULE1BQUFBLFVBQVUsR0FBR1MsU0FBYjtBQUNILEtBbkJ3QyxDQXFCekM7OztBQUNBLFFBQUlULFVBQVUsS0FBS0YsV0FBVyxDQUFDL0UsTUFBL0IsRUFBdUM7QUFDbkNzRixNQUFBQSxVQUFVLEdBQUdQLFdBQVcsQ0FBQ1EsU0FBWixDQUFzQk4sVUFBdEIsRUFBa0NZLFNBQWxDLENBQWI7QUFDQVYsTUFBQUEsS0FBSyxHQUFHQSxLQUFLLENBQUNLLE1BQU4sQ0FBYSxLQUFLQyxtQkFBTCxDQUF5QkgsVUFBekIsRUFBcUNOLGNBQXJDLENBQWIsQ0FBUjtBQUNIOztBQUNELFdBQU9HLEtBQVA7QUFDSDs7QUFFRE0sRUFBQUEsbUJBQW1CLENBQUNWLFdBQUQsRUFBY0MsY0FBZCxFQUE4QjtBQUM3QyxRQUFJQSxjQUFjLENBQUMsQ0FBRCxDQUFsQixFQUF1QjtBQUNuQjtBQUNBLGFBQU8sS0FBS0YsZUFBTCxDQUFxQkMsV0FBckIsRUFBa0NDLGNBQWMsQ0FBQ2pGLEtBQWYsQ0FBcUIsQ0FBckIsQ0FBbEMsQ0FBUDtBQUNILEtBSEQsTUFHTztBQUNIO0FBQ0EsYUFBTyxDQUFDLEtBQUs2RixlQUFMLENBQXFCYixXQUFyQixFQUFrQyxLQUFsQyxDQUFELENBQVA7QUFDSDtBQUNKOztBQXREaUI7O0FBeUR0QixNQUFNZSxlQUFOLFNBQThCcEIsZUFBOUIsQ0FBOEM7QUFDMUM7Ozs7Ozs7QUFPQWtCLEVBQUFBLGVBQWUsQ0FBQ0csT0FBRCxFQUFVQyxTQUFWLEVBQXFCO0FBQ2hDLFFBQUksQ0FBQ0EsU0FBTCxFQUFnQjtBQUNaO0FBQ0EsYUFBT0QsT0FBUDtBQUNIOztBQUVELFFBQUkvQixJQUFJLEdBQUcsbUJBQWlCLEtBQUtZLGNBQXRCLEdBQXFDLEtBQXJDLEdBQ0xtQixPQURLLEdBQ0ssU0FEaEI7O0FBR0EsUUFBSSxLQUFLbEIsYUFBVCxFQUF3QjtBQUNwQmIsTUFBQUEsSUFBSSxHQUFHLGVBQWFpQyxTQUFTLENBQUMsS0FBS3BCLGFBQU4sQ0FBdEIsR0FBMkMsS0FBM0MsR0FDRmIsSUFERSxHQUNHLE1BRFY7QUFFSDs7QUFDRCxXQUFPQSxJQUFQO0FBQ0g7O0FBdEJ5Qzs7QUF5QjlDLE1BQU1rQyxlQUFOLFNBQThCeEIsZUFBOUIsQ0FBOEM7QUFDMUNDLEVBQUFBLFdBQVcsQ0FBQ0MsY0FBRCxFQUFpQkMsYUFBakIsRUFBZ0M7QUFDdkMsVUFBTUQsY0FBTixFQUFzQkMsYUFBdEI7QUFDQSxTQUFLc0IsSUFBTCxHQUFZLENBQVo7QUFDSDtBQUVEOzs7Ozs7Ozs7QUFPQVAsRUFBQUEsZUFBZSxDQUFDRyxPQUFELEVBQVVDLFNBQVYsRUFBcUI7QUFDaEMsVUFBTUksR0FBRyxHQUFHLEtBQUtELElBQUwsRUFBWjs7QUFFQSxRQUFJRSxJQUFJLGdCQUNKO0FBQU0sTUFBQSxHQUFHLEVBQUVELEdBQVg7QUFBZ0IsTUFBQSxTQUFTLEVBQUVKLFNBQVMsR0FBRyxLQUFLcEIsY0FBUixHQUF5QjtBQUE3RCxPQUNNbUIsT0FETixDQURKOztBQUtBLFFBQUlDLFNBQVMsSUFBSSxLQUFLbkIsYUFBdEIsRUFBcUM7QUFDakN3QixNQUFBQSxJQUFJLGdCQUFHO0FBQUcsUUFBQSxHQUFHLEVBQUVELEdBQVI7QUFBYSxRQUFBLElBQUksRUFBRSxLQUFLdkI7QUFBeEIsU0FBeUN3QixJQUF6QyxDQUFQO0FBQ0g7O0FBRUQsV0FBT0EsSUFBUDtBQUNIOztBQTFCeUM7QUE4QjlDOzs7Ozs7Ozs7Ozs7Ozs7QUFhTyxTQUFTQyxVQUFULENBQW9CQyxPQUFwQixFQUE2QkMsVUFBN0IsRUFBeUNDLElBQUksR0FBQyxFQUE5QyxFQUFrRDtBQUNyRCxRQUFNQyxhQUFhLEdBQUdILE9BQU8sQ0FBQ0ksTUFBUixLQUFtQix3QkFBbkIsSUFBK0NKLE9BQU8sQ0FBQ0ssY0FBN0U7QUFDQSxNQUFJQyxZQUFZLEdBQUcsS0FBbkI7QUFFQSxNQUFJQyxjQUFjLEdBQUd4RixrQkFBckI7O0FBQ0EsTUFBSW1GLElBQUksQ0FBQ00sZ0JBQVQsRUFBMkI7QUFDdkJELElBQUFBLGNBQWMsR0FBR3RDLDBCQUFqQjtBQUNIOztBQUVELE1BQUl3QyxZQUFKO0FBQ0EsTUFBSUMsUUFBSjtBQUNBLE1BQUlDLG1CQUFKLENBWHFELENBWXJEO0FBQ0E7QUFDQTtBQUNBOztBQUNBLE1BQUk7QUFDQSxRQUFJVixVQUFVLElBQUlBLFVBQVUsQ0FBQ3hHLE1BQVgsR0FBb0IsQ0FBdEMsRUFBeUM7QUFDckMsWUFBTW1ILFdBQVcsR0FBRyxJQUFJckIsZUFBSixDQUFvQiw4QkFBcEIsRUFBb0RXLElBQUksQ0FBQzVCLGFBQXpELENBQXBCO0FBQ0EsWUFBTUcsY0FBYyxHQUFHd0IsVUFBVSxDQUFDWSxHQUFYLENBQWUsVUFBU3BCLFNBQVQsRUFBb0I7QUFDdEQsZUFBTywyQkFBYUEsU0FBYixFQUF3QmMsY0FBeEIsQ0FBUDtBQUNILE9BRnNCLENBQXZCLENBRnFDLENBS3JDOztBQUNBQSxNQUFBQSxjQUFjLENBQUNPLFVBQWYsR0FBNEIsVUFBU0MsUUFBVCxFQUFtQjtBQUMzQyxlQUFPSCxXQUFXLENBQUNyQyxlQUFaLENBQTRCd0MsUUFBNUIsRUFBc0N0QyxjQUF0QyxFQUFzRDVCLElBQXRELENBQTJELEVBQTNELENBQVA7QUFDSCxPQUZEO0FBR0g7O0FBRUQsUUFBSW1FLGFBQWEsR0FBRyxPQUFPaEIsT0FBTyxDQUFDSyxjQUFmLEtBQWtDLFFBQWxDLEdBQTZDTCxPQUFPLENBQUNLLGNBQXJELEdBQXNFLElBQTFGO0FBQ0EsVUFBTVksU0FBUyxHQUFHLE9BQU9qQixPQUFPLENBQUNrQixJQUFmLEtBQXdCLFFBQXhCLEdBQW1DbEIsT0FBTyxDQUFDa0IsSUFBM0MsR0FBa0QsSUFBcEU7QUFFQSxRQUFJaEIsSUFBSSxDQUFDaUIsa0JBQUwsSUFBMkJILGFBQS9CLEVBQThDQSxhQUFhLEdBQUdJLHFCQUFZQyxjQUFaLENBQTJCTCxhQUEzQixDQUFoQjtBQUM5Q1AsSUFBQUEsWUFBWSxHQUFHUCxJQUFJLENBQUNpQixrQkFBTCxHQUEwQkMscUJBQVlFLGVBQVosQ0FBNEJMLFNBQTVCLENBQTFCLEdBQW1FQSxTQUFsRjtBQUVBWCxJQUFBQSxZQUFZLEdBQUd2SCxpQkFBaUIsQ0FBQ29ILGFBQWEsR0FBR2EsYUFBSCxHQUFtQkMsU0FBakMsQ0FBaEMsQ0FsQkEsQ0FvQkE7O0FBQ0EsUUFBSWQsYUFBSixFQUFtQjtBQUNmUSxNQUFBQSxtQkFBbUIsR0FBRyxJQUF0QjtBQUNBRCxNQUFBQSxRQUFRLEdBQUcsMkJBQWFNLGFBQWIsRUFBNEJULGNBQTVCLENBQVg7QUFDSDtBQUNKLEdBekJELFNBeUJVO0FBQ04sV0FBT0EsY0FBYyxDQUFDTyxVQUF0QjtBQUNIOztBQUVELE1BQUlaLElBQUksQ0FBQ3FCLFlBQVQsRUFBdUI7QUFDbkIsV0FBT1osbUJBQW1CLEdBQUdELFFBQUgsR0FBY0QsWUFBeEM7QUFDSDs7QUFFRCxNQUFJZSxTQUFTLEdBQUcsS0FBaEI7O0FBQ0EsTUFBSSxDQUFDdEIsSUFBSSxDQUFDdUIsZUFBTixJQUF5Qm5CLFlBQTdCLEVBQTJDO0FBQ3ZDLFFBQUlvQixrQkFBa0IsR0FBR2pCLFlBQVksS0FBS25CLFNBQWpCLEdBQTZCbUIsWUFBWSxDQUFDa0IsSUFBYixFQUE3QixHQUFtRCxFQUE1RSxDQUR1QyxDQUd2QztBQUNBOztBQUNBRCxJQUFBQSxrQkFBa0IsR0FBR0Esa0JBQWtCLENBQUNFLE9BQW5CLENBQTJCbkosZ0JBQTNCLEVBQTZDLEVBQTdDLENBQXJCLENBTHVDLENBT3ZDO0FBQ0E7QUFDQTs7QUFDQWlKLElBQUFBLGtCQUFrQixHQUFHQSxrQkFBa0IsQ0FBQ0UsT0FBbkIsQ0FBMkJySixTQUEzQixFQUFzQyxFQUF0QyxDQUFyQjtBQUVBLFVBQU11RCxLQUFLLEdBQUdwRCxjQUFjLENBQUNtSixJQUFmLENBQW9CSCxrQkFBcEIsQ0FBZDtBQUNBRixJQUFBQSxTQUFTLEdBQUcxRixLQUFLLElBQUlBLEtBQUssQ0FBQyxDQUFELENBQWQsSUFBcUJBLEtBQUssQ0FBQyxDQUFELENBQUwsQ0FBU3JDLE1BQVQsS0FBb0JpSSxrQkFBa0IsQ0FBQ2pJLE1BQTVELE1BQ0E7QUFDQTtBQUNBO0FBRUlnSCxJQUFBQSxZQUFZLEtBQUtDLFFBQWpCLElBQTZCO0FBQzdCVixJQUFBQSxPQUFPLENBQUNLLGNBQVIsS0FBMkJmLFNBRDNCLElBRUMsQ0FBQ1UsT0FBTyxDQUFDSyxjQUFSLENBQXVCOUUsUUFBdkIsQ0FBZ0MsT0FBaEMsQ0FBRCxJQUNELENBQUN5RSxPQUFPLENBQUNLLGNBQVIsQ0FBdUI5RSxRQUF2QixDQUFnQyxRQUFoQyxDQVJMLENBQVo7QUFVSDs7QUFFRCxRQUFNdUcsU0FBUyxHQUFHLHlCQUFXO0FBQ3pCLHlCQUFxQixJQURJO0FBRXpCLDZCQUF5Qk4sU0FGQTtBQUd6QixxQkFBaUJyQixhQUFhLElBQUksQ0FBQ3FCO0FBSFYsR0FBWCxDQUFsQjtBQU1BLFNBQU9iLG1CQUFtQixnQkFDdEI7QUFBTSxJQUFBLEdBQUcsRUFBQyxNQUFWO0FBQWlCLElBQUEsR0FBRyxFQUFFVCxJQUFJLENBQUM2QixHQUEzQjtBQUFnQyxJQUFBLFNBQVMsRUFBRUQsU0FBM0M7QUFBc0QsSUFBQSx1QkFBdUIsRUFBRTtBQUFFOUcsTUFBQUEsTUFBTSxFQUFFMEY7QUFBVixLQUEvRTtBQUFxRyxJQUFBLEdBQUcsRUFBQztBQUF6RyxJQURzQixnQkFFdEI7QUFBTSxJQUFBLEdBQUcsRUFBQyxNQUFWO0FBQWlCLElBQUEsR0FBRyxFQUFFUixJQUFJLENBQUM2QixHQUEzQjtBQUFnQyxJQUFBLFNBQVMsRUFBRUQsU0FBM0M7QUFBc0QsSUFBQSxHQUFHLEVBQUM7QUFBMUQsS0FBbUVyQixZQUFuRSxDQUZKO0FBR0g7QUFFRDs7Ozs7Ozs7O0FBT08sU0FBU3VCLGFBQVQsQ0FBdUJoSixHQUF2QixFQUE0QmlKLE9BQU8sR0FBR2xHLHVCQUFja0csT0FBcEQsRUFBNkQ7QUFDaEUsU0FBTyxxQkFBZWpKLEdBQWYsRUFBb0JpSixPQUFwQixDQUFQO0FBQ0g7QUFFRDs7Ozs7Ozs7O0FBT08sU0FBU0MsY0FBVCxDQUF3QjVILE9BQXhCLEVBQWlDMkgsT0FBTyxHQUFHbEcsdUJBQWNrRyxPQUF6RCxFQUFrRTtBQUNyRSxTQUFPLHNCQUFnQjNILE9BQWhCLEVBQXlCMkgsT0FBekIsQ0FBUDtBQUNIO0FBRUQ7Ozs7Ozs7OztBQU9PLFNBQVNFLHNCQUFULENBQWdDQyxTQUFoQyxFQUEyQ0gsT0FBTyxHQUFHbEcsdUJBQWNrRyxPQUFuRSxFQUE0RTtBQUMvRSxTQUFPLDJCQUFhRCxhQUFhLENBQUNJLFNBQUQsRUFBWUgsT0FBWixDQUExQixFQUFnRGxILGtCQUFoRCxDQUFQO0FBQ0g7QUFFRDs7Ozs7Ozs7O0FBT08sU0FBU3NILGNBQVQsQ0FBd0J2QyxJQUF4QixFQUE4QjtBQUNqQyxVQUFRQSxJQUFJLENBQUN3QyxRQUFiO0FBQ0ksU0FBSyxJQUFMO0FBQ0EsU0FBSyxJQUFMO0FBQ0EsU0FBSyxJQUFMO0FBQ0EsU0FBSyxJQUFMO0FBQ0EsU0FBSyxJQUFMO0FBQ0EsU0FBSyxJQUFMO0FBQ0EsU0FBSyxLQUFMO0FBQ0EsU0FBSyxZQUFMO0FBQ0EsU0FBSyxLQUFMO0FBQ0EsU0FBSyxHQUFMO0FBQ0EsU0FBSyxJQUFMO0FBQ0EsU0FBSyxJQUFMO0FBQ0EsU0FBSyxJQUFMO0FBQ0EsU0FBSyxJQUFMO0FBQ0EsU0FBSyxPQUFMO0FBQ0EsU0FBSyxPQUFMO0FBQ0EsU0FBSyxPQUFMO0FBQ0EsU0FBSyxJQUFMO0FBQ0EsU0FBSyxJQUFMO0FBQ0EsU0FBSyxJQUFMO0FBQ0ksYUFBTyxJQUFQOztBQUNKO0FBQ0ksYUFBTyxLQUFQO0FBdkJSO0FBeUJIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxNywgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTkgTWljaGFlbCBUZWxhdHluc2tpIDw3dDNjaGd1eUBnbWFpbC5jb20+XG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IFJlcGx5VGhyZWFkIGZyb20gXCIuL2NvbXBvbmVudHMvdmlld3MvZWxlbWVudHMvUmVwbHlUaHJlYWRcIjtcblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBzYW5pdGl6ZUh0bWwgZnJvbSAnc2FuaXRpemUtaHRtbCc7XG5pbXBvcnQgKiBhcyBsaW5raWZ5IGZyb20gJ2xpbmtpZnlqcyc7XG5pbXBvcnQgbGlua2lmeU1hdHJpeCBmcm9tICcuL2xpbmtpZnktbWF0cml4JztcbmltcG9ydCBfbGlua2lmeUVsZW1lbnQgZnJvbSAnbGlua2lmeWpzL2VsZW1lbnQnO1xuaW1wb3J0IF9saW5raWZ5U3RyaW5nIGZyb20gJ2xpbmtpZnlqcy9zdHJpbmcnO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xuXG5pbXBvcnQgRU1PSklCQVNFX1JFR0VYIGZyb20gJ2Vtb2ppYmFzZS1yZWdleCc7XG5pbXBvcnQge3RyeVRyYW5zZm9ybVBlcm1hbGlua1RvTG9jYWxIcmVmfSBmcm9tIFwiLi91dGlscy9wZXJtYWxpbmtzL1Blcm1hbGlua3NcIjtcbmltcG9ydCB7U0hPUlRDT0RFX1RPX0VNT0pJLCBnZXRFbW9qaUZyb21Vbmljb2RlfSBmcm9tIFwiLi9lbW9qaVwiO1xuXG5saW5raWZ5TWF0cml4KGxpbmtpZnkpO1xuXG4vLyBBbnl0aGluZyBvdXRzaWRlIHRoZSBiYXNpYyBtdWx0aWxpbmd1YWwgcGxhbmUgd2lsbCBiZSBhIHN1cnJvZ2F0ZSBwYWlyXG5jb25zdCBTVVJST0dBVEVfUEFJUl9QQVRURVJOID0gLyhbXFx1ZDgwMC1cXHVkYmZmXSkoW1xcdWRjMDAtXFx1ZGZmZl0pLztcbi8vIEFuZCB0aGVyZSBhIGJ1bmNoIG1vcmUgc3ltYm9sIGNoYXJhY3RlcnMgdGhhdCBlbW9qaWJhc2UgaGFzIHdpdGhpbiB0aGVcbi8vIEJNUCwgc28gdGhpcyBpbmNsdWRlcyB0aGUgcmFuZ2VzIGZyb20gJ2xldHRlcmxpa2Ugc3ltYm9scycgdG9cbi8vICdtaXNjZWxsYW5lb3VzIHN5bWJvbHMgYW5kIGFycm93cycgd2hpY2ggc2hvdWxkIGNhdGNoIGFsbCBvZiB0aGVtXG4vLyAod2l0aCBwbGVudHkgb2YgZmFsc2UgcG9zaXRpdmVzLCBidXQgdGhhdCdzIE9LKVxuY29uc3QgU1lNQk9MX1BBVFRFUk4gPSAvKFtcXHUyMTAwLVxcdTJiZmZdKS87XG5cbi8vIFJlZ2V4IHBhdHRlcm4gZm9yIFplcm8tV2lkdGggam9pbmVyIHVuaWNvZGUgY2hhcmFjdGVyc1xuY29uc3QgWldKX1JFR0VYID0gbmV3IFJlZ0V4cChcIlxcdTIwMER8XFx1MjAwM1wiLCBcImdcIik7XG5cbi8vIFJlZ2V4IHBhdHRlcm4gZm9yIHdoaXRlc3BhY2UgY2hhcmFjdGVyc1xuY29uc3QgV0hJVEVTUEFDRV9SRUdFWCA9IG5ldyBSZWdFeHAoXCJcXFxcc1wiLCBcImdcIik7XG5cbmNvbnN0IEJJR0VNT0pJX1JFR0VYID0gbmV3IFJlZ0V4cChgXigke0VNT0pJQkFTRV9SRUdFWC5zb3VyY2V9KSskYCwgJ2knKTtcblxuY29uc3QgQ09MT1JfUkVHRVggPSAvXiNbMC05YS1mQS1GXXs2fSQvO1xuXG5jb25zdCBQRVJNSVRURURfVVJMX1NDSEVNRVMgPSBbJ2h0dHAnLCAnaHR0cHMnLCAnZnRwJywgJ21haWx0bycsICdtYWduZXQnXTtcblxuLypcbiAqIFJldHVybiB0cnVlIGlmIHRoZSBnaXZlbiBzdHJpbmcgY29udGFpbnMgZW1vamlcbiAqIFVzZXMgYSBtdWNoLCBtdWNoIHNpbXBsZXIgcmVnZXggdGhhbiBlbW9qaWJhc2UncyBzbyB3aWxsIGdpdmUgZmFsc2VcbiAqIHBvc2l0aXZlcywgYnV0IHVzZWZ1bCBmb3IgZmFzdC1wYXRoIHRlc3Rpbmcgc3RyaW5ncyB0byBzZWUgaWYgdGhleVxuICogbmVlZCBlbW9qaWZpY2F0aW9uLlxuICogdW5pY29kZVRvSW1hZ2UgdXNlcyB0aGlzIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBtaWdodENvbnRhaW5FbW9qaShzdHIpIHtcbiAgICByZXR1cm4gU1VSUk9HQVRFX1BBSVJfUEFUVEVSTi50ZXN0KHN0cikgfHwgU1lNQk9MX1BBVFRFUk4udGVzdChzdHIpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHNob3J0Y29kZSBmb3IgYW4gZW1vamkgY2hhcmFjdGVyLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBjaGFyIFRoZSBlbW9qaSBjaGFyYWN0ZXJcbiAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHNob3J0Y29kZSAoc3VjaCBhcyA6dGh1bWJ1cDopXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bmljb2RlVG9TaG9ydGNvZGUoY2hhcikge1xuICAgIGNvbnN0IGRhdGEgPSBnZXRFbW9qaUZyb21Vbmljb2RlKGNoYXIpO1xuICAgIHJldHVybiAoZGF0YSAmJiBkYXRhLnNob3J0Y29kZXMgPyBgOiR7ZGF0YS5zaG9ydGNvZGVzWzBdfTpgIDogJycpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHVuaWNvZGUgY2hhcmFjdGVyIGZvciBhbiBlbW9qaSBzaG9ydGNvZGVcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc2hvcnRjb2RlIFRoZSBzaG9ydGNvZGUgKHN1Y2ggYXMgOnRodW1idXA6KVxuICogQHJldHVybiB7U3RyaW5nfSBUaGUgZW1vamkgY2hhcmFjdGVyOyBudWxsIGlmIG5vbmUgZXhpc3RzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaG9ydGNvZGVUb1VuaWNvZGUoc2hvcnRjb2RlKSB7XG4gICAgc2hvcnRjb2RlID0gc2hvcnRjb2RlLnNsaWNlKDEsIHNob3J0Y29kZS5sZW5ndGggLSAxKTtcbiAgICBjb25zdCBkYXRhID0gU0hPUlRDT0RFX1RPX0VNT0pJLmdldChzaG9ydGNvZGUpO1xuICAgIHJldHVybiBkYXRhID8gZGF0YS51bmljb2RlIDogbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb2Nlc3NIdG1sRm9yU2VuZGluZyhodG1sOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbnRlbnREaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250ZW50RGl2LmlubmVySFRNTCA9IGh0bWw7XG5cbiAgICBpZiAoY29udGVudERpdi5jaGlsZHJlbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGNvbnRlbnREaXYuaW5uZXJIVE1MO1xuICAgIH1cblxuICAgIGxldCBjb250ZW50SFRNTCA9IFwiXCI7XG4gICAgZm9yIChsZXQgaT0wOyBpIDwgY29udGVudERpdi5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gY29udGVudERpdi5jaGlsZHJlbltpXTtcbiAgICAgICAgaWYgKGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAncCcpIHtcbiAgICAgICAgICAgIGNvbnRlbnRIVE1MICs9IGVsZW1lbnQuaW5uZXJIVE1MO1xuICAgICAgICAgICAgLy8gRG9uJ3QgYWRkIGEgPGJyIC8+IGZvciB0aGUgbGFzdCA8cD5cbiAgICAgICAgICAgIGlmIChpICE9PSBjb250ZW50RGl2LmNoaWxkcmVuLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICBjb250ZW50SFRNTCArPSAnPGJyIC8+JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHRlbXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIHRlbXAuYXBwZW5kQ2hpbGQoZWxlbWVudC5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgICAgICAgICAgY29udGVudEhUTUwgKz0gdGVtcC5pbm5lckhUTUw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY29udGVudEhUTUw7XG59XG5cbi8qXG4gKiBHaXZlbiBhbiB1bnRydXN0ZWQgSFRNTCBzdHJpbmcsIHJldHVybiBhIFJlYWN0IG5vZGUgd2l0aCBhbiBzYW5pdGl6ZWQgdmVyc2lvblxuICogb2YgdGhhdCBIVE1MLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVkSHRtbE5vZGUoaW5zYW5lSHRtbCkge1xuICAgIGNvbnN0IHNhbmVIdG1sID0gc2FuaXRpemVIdG1sKGluc2FuZUh0bWwsIHNhbml0aXplSHRtbFBhcmFtcyk7XG5cbiAgICByZXR1cm4gPGRpdiBkYW5nZXJvdXNseVNldElubmVySFRNTD17eyBfX2h0bWw6IHNhbmVIdG1sIH19IGRpcj1cImF1dG9cIiAvPjtcbn1cblxuLyoqXG4gKiBUZXN0cyBpZiBhIFVSTCBmcm9tIGFuIHVudHJ1c3RlZCBzb3VyY2UgbWF5IGJlIHNhZmVseSBwdXQgaW50byB0aGUgRE9NXG4gKiBUaGUgYmlnZ2VzdCB0aHJlYXQgaGVyZSBpcyBqYXZhc2NyaXB0OiBVUklzLlxuICogTm90ZSB0aGF0IHRoZSBIVE1MIHNhbml0aXNlciBsaWJyYXJ5IGhhcyBpdHMgb3duIGludGVybmFsIGxvZ2ljIGZvclxuICogZG9pbmcgdGhpcywgdG8gd2hpY2ggd2UgcGFzcyB0aGUgc2FtZSBsaXN0IG9mIHNjaGVtZXMuIFRoaXMgaXMgdXNlZCBpblxuICogb3RoZXIgcGxhY2VzIHdlIG5lZWQgdG8gc2FuaXRpc2UgVVJMcy5cbiAqIEByZXR1cm4gdHJ1ZSBpZiBwZXJtaXR0ZWQsIG90aGVyd2lzZSBmYWxzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNVcmxQZXJtaXR0ZWQoaW5wdXRVcmwpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBwYXJzZWQgPSB1cmwucGFyc2UoaW5wdXRVcmwpO1xuICAgICAgICBpZiAoIXBhcnNlZC5wcm90b2NvbCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAvLyBVUkwgcGFyc2VyIHByb3RvY29sIGluY2x1ZGVzIHRoZSB0cmFpbGluZyBjb2xvblxuICAgICAgICByZXR1cm4gUEVSTUlUVEVEX1VSTF9TQ0hFTUVTLmluY2x1ZGVzKHBhcnNlZC5wcm90b2NvbC5zbGljZSgwLCAtMSkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuY29uc3QgdHJhbnNmb3JtVGFncyA9IHsgLy8gY3VzdG9tIHRvIG1hdHJpeFxuICAgIC8vIGFkZCBibGFuayB0YXJnZXRzIHRvIGFsbCBoeXBlcmxpbmtzIGV4Y2VwdCB2ZWN0b3IgVVJMc1xuICAgICdhJzogZnVuY3Rpb24odGFnTmFtZSwgYXR0cmlicykge1xuICAgICAgICBpZiAoYXR0cmlicy5ocmVmKSB7XG4gICAgICAgICAgICBhdHRyaWJzLnRhcmdldCA9ICdfYmxhbmsnOyAvLyBieSBkZWZhdWx0XG5cbiAgICAgICAgICAgIGNvbnN0IHRyYW5zZm9ybWVkID0gdHJ5VHJhbnNmb3JtUGVybWFsaW5rVG9Mb2NhbEhyZWYoYXR0cmlicy5ocmVmKTtcbiAgICAgICAgICAgIGlmICh0cmFuc2Zvcm1lZCAhPT0gYXR0cmlicy5ocmVmIHx8IGF0dHJpYnMuaHJlZi5tYXRjaChsaW5raWZ5TWF0cml4LlZFQ1RPUl9VUkxfUEFUVEVSTikpIHtcbiAgICAgICAgICAgICAgICBhdHRyaWJzLmhyZWYgPSB0cmFuc2Zvcm1lZDtcbiAgICAgICAgICAgICAgICBkZWxldGUgYXR0cmlicy50YXJnZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYXR0cmlicy5yZWwgPSAnbm9yZWZlcnJlciBub29wZW5lcic7IC8vIGh0dHBzOi8vbWF0aGlhc2J5bmVucy5naXRodWIuaW8vcmVsLW5vb3BlbmVyL1xuICAgICAgICByZXR1cm4geyB0YWdOYW1lLCBhdHRyaWJzIH07XG4gICAgfSxcbiAgICAnaW1nJzogZnVuY3Rpb24odGFnTmFtZSwgYXR0cmlicykge1xuICAgICAgICAvLyBTdHJpcCBvdXQgaW1ncyB0aGF0IGFyZW4ndCBgbXhjYCBoZXJlIGluc3RlYWQgb2YgdXNpbmcgYWxsb3dlZFNjaGVtZXNCeVRhZ1xuICAgICAgICAvLyBiZWNhdXNlIHRyYW5zZm9ybVRhZ3MgaXMgdXNlZCBfYmVmb3JlXyB3ZSBmaWx0ZXIgYnkgYWxsb3dlZFNjaGVtZXNCeVRhZyBhbmRcbiAgICAgICAgLy8gd2UgZG9uJ3Qgd2FudCB0byBhbGxvdyBpbWFnZXMgd2l0aCBgaHR0cHM/YCBgc3JjYHMuXG4gICAgICAgIGlmICghYXR0cmlicy5zcmMgfHwgIWF0dHJpYnMuc3JjLnN0YXJ0c1dpdGgoJ214YzovLycpKSB7XG4gICAgICAgICAgICByZXR1cm4geyB0YWdOYW1lLCBhdHRyaWJzOiB7fX07XG4gICAgICAgIH1cbiAgICAgICAgYXR0cmlicy5zcmMgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkubXhjVXJsVG9IdHRwKFxuICAgICAgICAgICAgYXR0cmlicy5zcmMsXG4gICAgICAgICAgICBhdHRyaWJzLndpZHRoIHx8IDgwMCxcbiAgICAgICAgICAgIGF0dHJpYnMuaGVpZ2h0IHx8IDYwMCxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHsgdGFnTmFtZSwgYXR0cmlicyB9O1xuICAgIH0sXG4gICAgJ2NvZGUnOiBmdW5jdGlvbih0YWdOYW1lLCBhdHRyaWJzKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYXR0cmlicy5jbGFzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIC8vIEZpbHRlciBvdXQgYWxsIGNsYXNzZXMgb3RoZXIgdGhhbiBvbmVzIHN0YXJ0aW5nIHdpdGggbGFuZ3VhZ2UtIGZvciBzeW50YXggaGlnaGxpZ2h0aW5nLlxuICAgICAgICAgICAgY29uc3QgY2xhc3NlcyA9IGF0dHJpYnMuY2xhc3Muc3BsaXQoL1xccy8pLmZpbHRlcihmdW5jdGlvbihjbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjbC5zdGFydHNXaXRoKCdsYW5ndWFnZS0nKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYXR0cmlicy5jbGFzcyA9IGNsYXNzZXMuam9pbignICcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHRhZ05hbWUsIGF0dHJpYnMgfTtcbiAgICB9LFxuICAgICcqJzogZnVuY3Rpb24odGFnTmFtZSwgYXR0cmlicykge1xuICAgICAgICAvLyBEZWxldGUgYW55IHN0eWxlIHByZXZpb3VzbHkgYXNzaWduZWQsIHN0eWxlIGlzIGFuIGFsbG93ZWRUYWcgZm9yIGZvbnQgYW5kIHNwYW5cbiAgICAgICAgLy8gYmVjYXVzZSBhdHRyaWJ1dGVzIGFyZSBzdHJpcHBlZCBhZnRlciB0cmFuc2Zvcm1pbmdcbiAgICAgICAgZGVsZXRlIGF0dHJpYnMuc3R5bGU7XG5cbiAgICAgICAgLy8gU2FuaXRpc2UgYW5kIHRyYW5zZm9ybSBkYXRhLW14LWNvbG9yIGFuZCBkYXRhLW14LWJnLWNvbG9yIHRvIHRoZWlyIENTU1xuICAgICAgICAvLyBlcXVpdmFsZW50c1xuICAgICAgICBjb25zdCBjdXN0b21DU1NNYXBwZXIgPSB7XG4gICAgICAgICAgICAnZGF0YS1teC1jb2xvcic6ICdjb2xvcicsXG4gICAgICAgICAgICAnZGF0YS1teC1iZy1jb2xvcic6ICdiYWNrZ3JvdW5kLWNvbG9yJyxcbiAgICAgICAgICAgIC8vICRjdXN0b21BdHRyaWJ1dGVLZXk6ICRjc3NBdHRyaWJ1dGVLZXlcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgc3R5bGUgPSBcIlwiO1xuICAgICAgICBPYmplY3Qua2V5cyhjdXN0b21DU1NNYXBwZXIpLmZvckVhY2goKGN1c3RvbUF0dHJpYnV0ZUtleSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3NzQXR0cmlidXRlS2V5ID0gY3VzdG9tQ1NTTWFwcGVyW2N1c3RvbUF0dHJpYnV0ZUtleV07XG4gICAgICAgICAgICBjb25zdCBjdXN0b21BdHRyaWJ1dGVWYWx1ZSA9IGF0dHJpYnNbY3VzdG9tQXR0cmlidXRlS2V5XTtcbiAgICAgICAgICAgIGlmIChjdXN0b21BdHRyaWJ1dGVWYWx1ZSAmJlxuICAgICAgICAgICAgICAgIHR5cGVvZiBjdXN0b21BdHRyaWJ1dGVWYWx1ZSA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgICAgICAgICBDT0xPUl9SRUdFWC50ZXN0KGN1c3RvbUF0dHJpYnV0ZVZhbHVlKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgc3R5bGUgKz0gY3NzQXR0cmlidXRlS2V5ICsgXCI6XCIgKyBjdXN0b21BdHRyaWJ1dGVWYWx1ZSArIFwiO1wiO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBhdHRyaWJzW2N1c3RvbUF0dHJpYnV0ZUtleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChzdHlsZSkge1xuICAgICAgICAgICAgYXR0cmlicy5zdHlsZSA9IHN0eWxlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgdGFnTmFtZSwgYXR0cmlicyB9O1xuICAgIH0sXG59O1xuXG5jb25zdCBzYW5pdGl6ZUh0bWxQYXJhbXMgPSB7XG4gICAgYWxsb3dlZFRhZ3M6IFtcbiAgICAgICAgJ2ZvbnQnLCAvLyBjdXN0b20gdG8gbWF0cml4IGZvciBJUkMtc3R5bGUgZm9udCBjb2xvcmluZ1xuICAgICAgICAnZGVsJywgLy8gZm9yIG1hcmtkb3duXG4gICAgICAgICdoMScsICdoMicsICdoMycsICdoNCcsICdoNScsICdoNicsICdibG9ja3F1b3RlJywgJ3AnLCAnYScsICd1bCcsICdvbCcsICdzdXAnLCAnc3ViJyxcbiAgICAgICAgJ25sJywgJ2xpJywgJ2InLCAnaScsICd1JywgJ3N0cm9uZycsICdlbScsICdzdHJpa2UnLCAnY29kZScsICdocicsICdicicsICdkaXYnLFxuICAgICAgICAndGFibGUnLCAndGhlYWQnLCAnY2FwdGlvbicsICd0Ym9keScsICd0cicsICd0aCcsICd0ZCcsICdwcmUnLCAnc3BhbicsICdpbWcnLFxuICAgIF0sXG4gICAgYWxsb3dlZEF0dHJpYnV0ZXM6IHtcbiAgICAgICAgLy8gY3VzdG9tIG9uZXMgZmlyc3Q6XG4gICAgICAgIGZvbnQ6IFsnY29sb3InLCAnZGF0YS1teC1iZy1jb2xvcicsICdkYXRhLW14LWNvbG9yJywgJ3N0eWxlJ10sIC8vIGN1c3RvbSB0byBtYXRyaXhcbiAgICAgICAgc3BhbjogWydkYXRhLW14LWJnLWNvbG9yJywgJ2RhdGEtbXgtY29sb3InLCAnZGF0YS1teC1zcG9pbGVyJywgJ3N0eWxlJ10sIC8vIGN1c3RvbSB0byBtYXRyaXhcbiAgICAgICAgYTogWydocmVmJywgJ25hbWUnLCAndGFyZ2V0JywgJ3JlbCddLCAvLyByZW1vdGUgdGFyZ2V0OiBjdXN0b20gdG8gbWF0cml4XG4gICAgICAgIGltZzogWydzcmMnLCAnd2lkdGgnLCAnaGVpZ2h0JywgJ2FsdCcsICd0aXRsZSddLFxuICAgICAgICBvbDogWydzdGFydCddLFxuICAgICAgICBjb2RlOiBbJ2NsYXNzJ10sIC8vIFdlIGRvbid0IGFjdHVhbGx5IGFsbG93IGFsbCBjbGFzc2VzLCB3ZSBmaWx0ZXIgdGhlbSBpbiB0cmFuc2Zvcm1UYWdzXG4gICAgfSxcbiAgICAvLyBMb3RzIG9mIHRoZXNlIHdvbid0IGNvbWUgdXAgYnkgZGVmYXVsdCBiZWNhdXNlIHdlIGRvbid0IGFsbG93IHRoZW1cbiAgICBzZWxmQ2xvc2luZzogWydpbWcnLCAnYnInLCAnaHInLCAnYXJlYScsICdiYXNlJywgJ2Jhc2Vmb250JywgJ2lucHV0JywgJ2xpbmsnLCAnbWV0YSddLFxuICAgIC8vIFVSTCBzY2hlbWVzIHdlIHBlcm1pdFxuICAgIGFsbG93ZWRTY2hlbWVzOiBQRVJNSVRURURfVVJMX1NDSEVNRVMsXG5cbiAgICBhbGxvd1Byb3RvY29sUmVsYXRpdmU6IGZhbHNlLFxuICAgIHRyYW5zZm9ybVRhZ3MsXG59O1xuXG4vLyB0aGlzIGlzIHRoZSBzYW1lIGFzIHRoZSBhYm92ZSBleGNlcHQgd2l0aCBsZXNzIHJld3JpdGluZ1xuY29uc3QgY29tcG9zZXJTYW5pdGl6ZUh0bWxQYXJhbXMgPSBPYmplY3QuYXNzaWduKHt9LCBzYW5pdGl6ZUh0bWxQYXJhbXMpO1xuY29tcG9zZXJTYW5pdGl6ZUh0bWxQYXJhbXMudHJhbnNmb3JtVGFncyA9IHtcbiAgICAnY29kZSc6IHRyYW5zZm9ybVRhZ3NbJ2NvZGUnXSxcbiAgICAnKic6IHRyYW5zZm9ybVRhZ3NbJyonXSxcbn07XG5cbmNsYXNzIEJhc2VIaWdobGlnaHRlciB7XG4gICAgY29uc3RydWN0b3IoaGlnaGxpZ2h0Q2xhc3MsIGhpZ2hsaWdodExpbmspIHtcbiAgICAgICAgdGhpcy5oaWdobGlnaHRDbGFzcyA9IGhpZ2hsaWdodENsYXNzO1xuICAgICAgICB0aGlzLmhpZ2hsaWdodExpbmsgPSBoaWdobGlnaHRMaW5rO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGFwcGx5IHRoZSBoaWdobGlnaHRzIHRvIGEgc2VjdGlvbiBvZiB0ZXh0XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2FmZVNuaXBwZXQgVGhlIHNuaXBwZXQgb2YgdGV4dCB0byBhcHBseSB0aGUgaGlnaGxpZ2h0c1xuICAgICAqICAgICB0by5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBzYWZlSGlnaGxpZ2h0cyBBIGxpc3Qgb2Ygc3Vic3RyaW5ncyB0byBoaWdobGlnaHQsXG4gICAgICogICAgIHNvcnRlZCBieSBkZXNjZW5kaW5nIGxlbmd0aC5cbiAgICAgKlxuICAgICAqIHJldHVybnMgYSBsaXN0IG9mIHJlc3VsdHMgKHN0cmluZ3MgZm9yIEh0bWxIaWdobGlnaGVyLCByZWFjdCBub2RlcyBmb3JcbiAgICAgKiBUZXh0SGlnaGxpZ2h0ZXIpLlxuICAgICAqL1xuICAgIGFwcGx5SGlnaGxpZ2h0cyhzYWZlU25pcHBldCwgc2FmZUhpZ2hsaWdodHMpIHtcbiAgICAgICAgbGV0IGxhc3RPZmZzZXQgPSAwO1xuICAgICAgICBsZXQgb2Zmc2V0O1xuICAgICAgICBsZXQgbm9kZXMgPSBbXTtcblxuICAgICAgICBjb25zdCBzYWZlSGlnaGxpZ2h0ID0gc2FmZUhpZ2hsaWdodHNbMF07XG4gICAgICAgIHdoaWxlICgob2Zmc2V0ID0gc2FmZVNuaXBwZXQudG9Mb3dlckNhc2UoKS5pbmRleE9mKHNhZmVIaWdobGlnaHQudG9Mb3dlckNhc2UoKSwgbGFzdE9mZnNldCkpID49IDApIHtcbiAgICAgICAgICAgIC8vIGhhbmRsZSBwcmVhbWJsZVxuICAgICAgICAgICAgaWYgKG9mZnNldCA+IGxhc3RPZmZzZXQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3ViU25pcHBldCA9IHNhZmVTbmlwcGV0LnN1YnN0cmluZyhsYXN0T2Zmc2V0LCBvZmZzZXQpO1xuICAgICAgICAgICAgICAgIG5vZGVzID0gbm9kZXMuY29uY2F0KHRoaXMuX2FwcGx5U3ViSGlnaGxpZ2h0cyhzdWJTbmlwcGV0LCBzYWZlSGlnaGxpZ2h0cykpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBkbyBoaWdobGlnaHQuIHVzZSB0aGUgb3JpZ2luYWwgc3RyaW5nIHJhdGhlciB0aGFuIHNhZmVIaWdobGlnaHRcbiAgICAgICAgICAgIC8vIHRvIHByZXNlcnZlIHRoZSBvcmlnaW5hbCBjYXNpbmcuXG4gICAgICAgICAgICBjb25zdCBlbmRPZmZzZXQgPSBvZmZzZXQgKyBzYWZlSGlnaGxpZ2h0Lmxlbmd0aDtcbiAgICAgICAgICAgIG5vZGVzLnB1c2godGhpcy5fcHJvY2Vzc1NuaXBwZXQoc2FmZVNuaXBwZXQuc3Vic3RyaW5nKG9mZnNldCwgZW5kT2Zmc2V0KSwgdHJ1ZSkpO1xuXG4gICAgICAgICAgICBsYXN0T2Zmc2V0ID0gZW5kT2Zmc2V0O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaGFuZGxlIHBvc3RhbWJsZVxuICAgICAgICBpZiAobGFzdE9mZnNldCAhPT0gc2FmZVNuaXBwZXQubGVuZ3RoKSB7XG4gICAgICAgICAgICBzdWJTbmlwcGV0ID0gc2FmZVNuaXBwZXQuc3Vic3RyaW5nKGxhc3RPZmZzZXQsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICBub2RlcyA9IG5vZGVzLmNvbmNhdCh0aGlzLl9hcHBseVN1YkhpZ2hsaWdodHMoc3ViU25pcHBldCwgc2FmZUhpZ2hsaWdodHMpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbm9kZXM7XG4gICAgfVxuXG4gICAgX2FwcGx5U3ViSGlnaGxpZ2h0cyhzYWZlU25pcHBldCwgc2FmZUhpZ2hsaWdodHMpIHtcbiAgICAgICAgaWYgKHNhZmVIaWdobGlnaHRzWzFdKSB7XG4gICAgICAgICAgICAvLyByZWN1cnNlIGludG8gdGhpcyByYW5nZSB0byBjaGVjayBmb3IgdGhlIG5leHQgc2V0IG9mIGhpZ2hsaWdodCBtYXRjaGVzXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcHBseUhpZ2hsaWdodHMoc2FmZVNuaXBwZXQsIHNhZmVIaWdobGlnaHRzLnNsaWNlKDEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG5vIG1vcmUgaGlnaGxpZ2h0cyB0byBiZSBmb3VuZCwganVzdCByZXR1cm4gdGhlIHVuaGlnaGxpZ2h0ZWQgc3RyaW5nXG4gICAgICAgICAgICByZXR1cm4gW3RoaXMuX3Byb2Nlc3NTbmlwcGV0KHNhZmVTbmlwcGV0LCBmYWxzZSldO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5jbGFzcyBIdG1sSGlnaGxpZ2h0ZXIgZXh0ZW5kcyBCYXNlSGlnaGxpZ2h0ZXIge1xuICAgIC8qIGhpZ2hsaWdodCB0aGUgZ2l2ZW4gc25pcHBldCBpZiByZXF1aXJlZFxuICAgICAqXG4gICAgICogc25pcHBldDogY29udGVudCBvZiB0aGUgc3BhbjsgbXVzdCBoYXZlIGJlZW4gc2FuaXRpc2VkXG4gICAgICogaGlnaGxpZ2h0OiB0cnVlIHRvIGhpZ2hsaWdodCBhcyBhIHNlYXJjaCBtYXRjaFxuICAgICAqXG4gICAgICogcmV0dXJucyBhbiBIVE1MIHN0cmluZ1xuICAgICAqL1xuICAgIF9wcm9jZXNzU25pcHBldChzbmlwcGV0LCBoaWdobGlnaHQpIHtcbiAgICAgICAgaWYgKCFoaWdobGlnaHQpIHtcbiAgICAgICAgICAgIC8vIG5vdGhpbmcgcmVxdWlyZWQgaGVyZVxuICAgICAgICAgICAgcmV0dXJuIHNuaXBwZXQ7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc3BhbiA9IFwiPHNwYW4gY2xhc3M9XFxcIlwiK3RoaXMuaGlnaGxpZ2h0Q2xhc3MrXCJcXFwiPlwiXG4gICAgICAgICAgICArIHNuaXBwZXQgKyBcIjwvc3Bhbj5cIjtcblxuICAgICAgICBpZiAodGhpcy5oaWdobGlnaHRMaW5rKSB7XG4gICAgICAgICAgICBzcGFuID0gXCI8YSBocmVmPVxcXCJcIitlbmNvZGVVUkkodGhpcy5oaWdobGlnaHRMaW5rKStcIlxcXCI+XCJcbiAgICAgICAgICAgICAgICArc3BhbitcIjwvYT5cIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3BhbjtcbiAgICB9XG59XG5cbmNsYXNzIFRleHRIaWdobGlnaHRlciBleHRlbmRzIEJhc2VIaWdobGlnaHRlciB7XG4gICAgY29uc3RydWN0b3IoaGlnaGxpZ2h0Q2xhc3MsIGhpZ2hsaWdodExpbmspIHtcbiAgICAgICAgc3VwZXIoaGlnaGxpZ2h0Q2xhc3MsIGhpZ2hsaWdodExpbmspO1xuICAgICAgICB0aGlzLl9rZXkgPSAwO1xuICAgIH1cblxuICAgIC8qIGNyZWF0ZSBhIDxzcGFuPiBub2RlIHRvIGhvbGQgdGhlIGdpdmVuIGNvbnRlbnRcbiAgICAgKlxuICAgICAqIHNuaXBwZXQ6IGNvbnRlbnQgb2YgdGhlIHNwYW5cbiAgICAgKiBoaWdobGlnaHQ6IHRydWUgdG8gaGlnaGxpZ2h0IGFzIGEgc2VhcmNoIG1hdGNoXG4gICAgICpcbiAgICAgKiByZXR1cm5zIGEgUmVhY3Qgbm9kZVxuICAgICAqL1xuICAgIF9wcm9jZXNzU25pcHBldChzbmlwcGV0LCBoaWdobGlnaHQpIHtcbiAgICAgICAgY29uc3Qga2V5ID0gdGhpcy5fa2V5Kys7XG5cbiAgICAgICAgbGV0IG5vZGUgPVxuICAgICAgICAgICAgPHNwYW4ga2V5PXtrZXl9IGNsYXNzTmFtZT17aGlnaGxpZ2h0ID8gdGhpcy5oaWdobGlnaHRDbGFzcyA6IG51bGx9PlxuICAgICAgICAgICAgICAgIHsgc25pcHBldCB9XG4gICAgICAgICAgICA8L3NwYW4+O1xuXG4gICAgICAgIGlmIChoaWdobGlnaHQgJiYgdGhpcy5oaWdobGlnaHRMaW5rKSB7XG4gICAgICAgICAgICBub2RlID0gPGEga2V5PXtrZXl9IGhyZWY9e3RoaXMuaGlnaGxpZ2h0TGlua30+eyBub2RlIH08L2E+O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxufVxuXG5cbi8qIHR1cm4gYSBtYXRyaXggZXZlbnQgYm9keSBpbnRvIGh0bWxcbiAqXG4gKiBjb250ZW50OiAnY29udGVudCcgb2YgdGhlIE1hdHJpeEV2ZW50XG4gKlxuICogaGlnaGxpZ2h0czogb3B0aW9uYWwgbGlzdCBvZiB3b3JkcyB0byBoaWdobGlnaHQsIG9yZGVyZWQgYnkgbG9uZ2VzdCB3b3JkIGZpcnN0XG4gKlxuICogb3B0cy5oaWdobGlnaHRMaW5rOiBvcHRpb25hbCBocmVmIHRvIGFkZCB0byBoaWdobGlnaHRlZCB3b3Jkc1xuICogb3B0cy5kaXNhYmxlQmlnRW1vamk6IG9wdGlvbmFsIGFyZ3VtZW50IHRvIGRpc2FibGUgdGhlIGJpZyBlbW9qaSBjbGFzcy5cbiAqIG9wdHMuc3RyaXBSZXBseUZhbGxiYWNrOiBvcHRpb25hbCBhcmd1bWVudCBzcGVjaWZ5aW5nIHRoZSBldmVudCBpcyBhIHJlcGx5IGFuZCBzbyBmYWxsYmFjayBuZWVkcyByZW1vdmluZ1xuICogb3B0cy5yZXR1cm5TdHJpbmc6IHJldHVybiBhbiBIVE1MIHN0cmluZyByYXRoZXIgdGhhbiBKU1ggZWxlbWVudHNcbiAqIG9wdHMuZm9yQ29tcG9zZXJRdW90ZTogb3B0aW9uYWwgcGFyYW0gdG8gbGVzc2VuIHRoZSB1cmwgcmV3cml0aW5nIGRvbmUgYnkgc2FuaXRpemF0aW9uLCBmb3IgcXVvdGluZyBpbnRvIGNvbXBvc2VyXG4gKiBvcHRzLnJlZjogUmVhY3QgcmVmIHRvIGF0dGFjaCB0byBhbnkgUmVhY3QgY29tcG9uZW50cyByZXR1cm5lZCAobm90IGNvbXBhdGlibGUgd2l0aCBvcHRzLnJldHVyblN0cmluZylcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJvZHlUb0h0bWwoY29udGVudCwgaGlnaGxpZ2h0cywgb3B0cz17fSkge1xuICAgIGNvbnN0IGlzSHRtbE1lc3NhZ2UgPSBjb250ZW50LmZvcm1hdCA9PT0gXCJvcmcubWF0cml4LmN1c3RvbS5odG1sXCIgJiYgY29udGVudC5mb3JtYXR0ZWRfYm9keTtcbiAgICBsZXQgYm9keUhhc0Vtb2ppID0gZmFsc2U7XG5cbiAgICBsZXQgc2FuaXRpemVQYXJhbXMgPSBzYW5pdGl6ZUh0bWxQYXJhbXM7XG4gICAgaWYgKG9wdHMuZm9yQ29tcG9zZXJRdW90ZSkge1xuICAgICAgICBzYW5pdGl6ZVBhcmFtcyA9IGNvbXBvc2VyU2FuaXRpemVIdG1sUGFyYW1zO1xuICAgIH1cblxuICAgIGxldCBzdHJpcHBlZEJvZHk7XG4gICAgbGV0IHNhZmVCb2R5O1xuICAgIGxldCBpc0Rpc3BsYXllZFdpdGhIdG1sO1xuICAgIC8vIFhYWDogV2Ugc2FuaXRpemUgdGhlIEhUTUwgd2hpbHN0IGFsc28gaGlnaGxpZ2h0aW5nIGl0cyB0ZXh0IG5vZGVzLCB0byBhdm9pZCBhY2NpZGVudGFsbHkgdHJ5aW5nXG4gICAgLy8gdG8gaGlnaGxpZ2h0IEhUTUwgdGFncyB0aGVtc2VsdmVzLiAgSG93ZXZlciwgdGhpcyBkb2VzIG1lYW4gdGhhdCB3ZSBkb24ndCBoaWdobGlnaHQgdGV4dG5vZGVzIHdoaWNoXG4gICAgLy8gYXJlIGludGVycnVwdGVkIGJ5IEhUTUwgdGFncyAobm90IHRoYXQgd2UgZGlkIGJlZm9yZSkgLSBlLmcuIGZvbzxzcGFuLz5iYXIgd29uJ3QgZ2V0IGhpZ2hsaWdodGVkXG4gICAgLy8gYnkgYW4gYXR0ZW1wdCB0byBzZWFyY2ggZm9yICdmb29iYXInLiAgVGhlbiBhZ2FpbiwgdGhlIHNlYXJjaCBxdWVyeSBwcm9iYWJseSB3b3VsZG4ndCB3b3JrIGVpdGhlclxuICAgIHRyeSB7XG4gICAgICAgIGlmIChoaWdobGlnaHRzICYmIGhpZ2hsaWdodHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgaGlnaGxpZ2h0ZXIgPSBuZXcgSHRtbEhpZ2hsaWdodGVyKFwibXhfRXZlbnRUaWxlX3NlYXJjaEhpZ2hsaWdodFwiLCBvcHRzLmhpZ2hsaWdodExpbmspO1xuICAgICAgICAgICAgY29uc3Qgc2FmZUhpZ2hsaWdodHMgPSBoaWdobGlnaHRzLm1hcChmdW5jdGlvbihoaWdobGlnaHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2FuaXRpemVIdG1sKGhpZ2hsaWdodCwgc2FuaXRpemVQYXJhbXMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBYWFg6IGhhY2t5IGJvZGdlIHRvIHRlbXBvcmFyaWx5IGFwcGx5IGEgdGV4dEZpbHRlciB0byB0aGUgc2FuaXRpemVQYXJhbXMgc3RydWN0dXJlLlxuICAgICAgICAgICAgc2FuaXRpemVQYXJhbXMudGV4dEZpbHRlciA9IGZ1bmN0aW9uKHNhZmVUZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhpZ2hsaWdodGVyLmFwcGx5SGlnaGxpZ2h0cyhzYWZlVGV4dCwgc2FmZUhpZ2hsaWdodHMpLmpvaW4oJycpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBmb3JtYXR0ZWRCb2R5ID0gdHlwZW9mIGNvbnRlbnQuZm9ybWF0dGVkX2JvZHkgPT09ICdzdHJpbmcnID8gY29udGVudC5mb3JtYXR0ZWRfYm9keSA6IG51bGw7XG4gICAgICAgIGNvbnN0IHBsYWluQm9keSA9IHR5cGVvZiBjb250ZW50LmJvZHkgPT09ICdzdHJpbmcnID8gY29udGVudC5ib2R5IDogbnVsbDtcblxuICAgICAgICBpZiAob3B0cy5zdHJpcFJlcGx5RmFsbGJhY2sgJiYgZm9ybWF0dGVkQm9keSkgZm9ybWF0dGVkQm9keSA9IFJlcGx5VGhyZWFkLnN0cmlwSFRNTFJlcGx5KGZvcm1hdHRlZEJvZHkpO1xuICAgICAgICBzdHJpcHBlZEJvZHkgPSBvcHRzLnN0cmlwUmVwbHlGYWxsYmFjayA/IFJlcGx5VGhyZWFkLnN0cmlwUGxhaW5SZXBseShwbGFpbkJvZHkpIDogcGxhaW5Cb2R5O1xuXG4gICAgICAgIGJvZHlIYXNFbW9qaSA9IG1pZ2h0Q29udGFpbkVtb2ppKGlzSHRtbE1lc3NhZ2UgPyBmb3JtYXR0ZWRCb2R5IDogcGxhaW5Cb2R5KTtcblxuICAgICAgICAvLyBPbmx5IGdlbmVyYXRlIHNhZmVCb2R5IGlmIHRoZSBtZXNzYWdlIHdhcyBzZW50IGFzIG9yZy5tYXRyaXguY3VzdG9tLmh0bWxcbiAgICAgICAgaWYgKGlzSHRtbE1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGlzRGlzcGxheWVkV2l0aEh0bWwgPSB0cnVlO1xuICAgICAgICAgICAgc2FmZUJvZHkgPSBzYW5pdGl6ZUh0bWwoZm9ybWF0dGVkQm9keSwgc2FuaXRpemVQYXJhbXMpO1xuICAgICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgICAgZGVsZXRlIHNhbml0aXplUGFyYW1zLnRleHRGaWx0ZXI7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMucmV0dXJuU3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBpc0Rpc3BsYXllZFdpdGhIdG1sID8gc2FmZUJvZHkgOiBzdHJpcHBlZEJvZHk7XG4gICAgfVxuXG4gICAgbGV0IGVtb2ppQm9keSA9IGZhbHNlO1xuICAgIGlmICghb3B0cy5kaXNhYmxlQmlnRW1vamkgJiYgYm9keUhhc0Vtb2ppKSB7XG4gICAgICAgIGxldCBjb250ZW50Qm9keVRyaW1tZWQgPSBzdHJpcHBlZEJvZHkgIT09IHVuZGVmaW5lZCA/IHN0cmlwcGVkQm9keS50cmltKCkgOiAnJztcblxuICAgICAgICAvLyBJZ25vcmUgc3BhY2VzIGluIGJvZHkgdGV4dC4gRW1vamlzIHdpdGggc3BhY2VzIGluIGJldHdlZW4gc2hvdWxkXG4gICAgICAgIC8vIHN0aWxsIGJlIGNvdW50ZWQgYXMgcHVyZWx5IGVtb2ppIG1lc3NhZ2VzLlxuICAgICAgICBjb250ZW50Qm9keVRyaW1tZWQgPSBjb250ZW50Qm9keVRyaW1tZWQucmVwbGFjZShXSElURVNQQUNFX1JFR0VYLCAnJyk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIHplcm8gd2lkdGggam9pbmVyIGNoYXJhY3RlcnMgZnJvbSBlbW9qaSBtZXNzYWdlcy4gVGhpcyBlbnN1cmVzXG4gICAgICAgIC8vIHRoYXQgZW1vamlzIHRoYXQgYXJlIG1hZGUgdXAgb2YgbXVsdGlwbGUgdW5pY29kZSBjaGFyYWN0ZXJzIGFyZSBzdGlsbFxuICAgICAgICAvLyBwcmVzZW50ZWQgYXMgbGFyZ2UuXG4gICAgICAgIGNvbnRlbnRCb2R5VHJpbW1lZCA9IGNvbnRlbnRCb2R5VHJpbW1lZC5yZXBsYWNlKFpXSl9SRUdFWCwgJycpO1xuXG4gICAgICAgIGNvbnN0IG1hdGNoID0gQklHRU1PSklfUkVHRVguZXhlYyhjb250ZW50Qm9keVRyaW1tZWQpO1xuICAgICAgICBlbW9qaUJvZHkgPSBtYXRjaCAmJiBtYXRjaFswXSAmJiBtYXRjaFswXS5sZW5ndGggPT09IGNvbnRlbnRCb2R5VHJpbW1lZC5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICAgICAgLy8gUHJldmVudCB1c2VyIHBpbGxzIGV4cGFuZGluZyBmb3IgdXNlcnMgd2l0aCBvbmx5IGVtb2ppIGluXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZWlyIHVzZXJuYW1lLiBQZXJtYWxpbmtzIChsaW5rcyBpbiBwaWxscykgY2FuIGJlIGFueSBVUkxcbiAgICAgICAgICAgICAgICAgICAgLy8gbm93LCBzbyB3ZSBqdXN0IGNoZWNrIGZvciBhbiBIVFRQLWxvb2tpbmcgdGhpbmcuXG4gICAgICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmlwcGVkQm9keSA9PT0gc2FmZUJvZHkgfHwgLy8gcmVwbGllcyBoYXZlIHRoZSBodG1sIGZhbGxiYWNrcywgYWNjb3VudCBmb3IgdGhhdCBoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50LmZvcm1hdHRlZF9ib2R5ID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICghY29udGVudC5mb3JtYXR0ZWRfYm9keS5pbmNsdWRlcyhcImh0dHA6XCIpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAhY29udGVudC5mb3JtYXR0ZWRfYm9keS5pbmNsdWRlcyhcImh0dHBzOlwiKSlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBjbGFzc05hbWUgPSBjbGFzc05hbWVzKHtcbiAgICAgICAgJ214X0V2ZW50VGlsZV9ib2R5JzogdHJ1ZSxcbiAgICAgICAgJ214X0V2ZW50VGlsZV9iaWdFbW9qaSc6IGVtb2ppQm9keSxcbiAgICAgICAgJ21hcmtkb3duLWJvZHknOiBpc0h0bWxNZXNzYWdlICYmICFlbW9qaUJvZHksXG4gICAgfSk7XG5cbiAgICByZXR1cm4gaXNEaXNwbGF5ZWRXaXRoSHRtbCA/XG4gICAgICAgIDxzcGFuIGtleT1cImJvZHlcIiByZWY9e29wdHMucmVmfSBjbGFzc05hbWU9e2NsYXNzTmFtZX0gZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3sgX19odG1sOiBzYWZlQm9keSB9fSBkaXI9XCJhdXRvXCIgLz4gOlxuICAgICAgICA8c3BhbiBrZXk9XCJib2R5XCIgcmVmPXtvcHRzLnJlZn0gY2xhc3NOYW1lPXtjbGFzc05hbWV9IGRpcj1cImF1dG9cIj57IHN0cmlwcGVkQm9keSB9PC9zcGFuPjtcbn1cblxuLyoqXG4gKiBMaW5raWZpZXMgdGhlIGdpdmVuIHN0cmluZy4gVGhpcyBpcyBhIHdyYXBwZXIgYXJvdW5kICdsaW5raWZ5anMvc3RyaW5nJy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyIHN0cmluZyB0byBsaW5raWZ5XG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgZm9yIGxpbmtpZnlTdHJpbmcuIERlZmF1bHQ6IGxpbmtpZnlNYXRyaXgub3B0aW9uc1xuICogQHJldHVybnMge3N0cmluZ30gTGlua2lmaWVkIHN0cmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gbGlua2lmeVN0cmluZyhzdHIsIG9wdGlvbnMgPSBsaW5raWZ5TWF0cml4Lm9wdGlvbnMpIHtcbiAgICByZXR1cm4gX2xpbmtpZnlTdHJpbmcoc3RyLCBvcHRpb25zKTtcbn1cblxuLyoqXG4gKiBMaW5raWZpZXMgdGhlIGdpdmVuIERPTSBlbGVtZW50LiBUaGlzIGlzIGEgd3JhcHBlciBhcm91bmQgJ2xpbmtpZnlqcy9lbGVtZW50Jy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gZWxlbWVudCBET00gZWxlbWVudCB0byBsaW5raWZ5XG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgZm9yIGxpbmtpZnlFbGVtZW50LiBEZWZhdWx0OiBsaW5raWZ5TWF0cml4Lm9wdGlvbnNcbiAqIEByZXR1cm5zIHtvYmplY3R9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaW5raWZ5RWxlbWVudChlbGVtZW50LCBvcHRpb25zID0gbGlua2lmeU1hdHJpeC5vcHRpb25zKSB7XG4gICAgcmV0dXJuIF9saW5raWZ5RWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcbn1cblxuLyoqXG4gKiBMaW5raWZ5IHRoZSBnaXZlbiBzdHJpbmcgYW5kIHNhbml0aXplIHRoZSBIVE1MIGFmdGVyd2FyZHMuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGRpcnR5SHRtbCBUaGUgSFRNTCBzdHJpbmcgdG8gc2FuaXRpemUgYW5kIGxpbmtpZnlcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gT3B0aW9ucyBmb3IgbGlua2lmeVN0cmluZy4gRGVmYXVsdDogbGlua2lmeU1hdHJpeC5vcHRpb25zXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gbGlua2lmeUFuZFNhbml0aXplSHRtbChkaXJ0eUh0bWwsIG9wdGlvbnMgPSBsaW5raWZ5TWF0cml4Lm9wdGlvbnMpIHtcbiAgICByZXR1cm4gc2FuaXRpemVIdG1sKGxpbmtpZnlTdHJpbmcoZGlydHlIdG1sLCBvcHRpb25zKSwgc2FuaXRpemVIdG1sUGFyYW1zKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGlmIGEgbm9kZSBpcyBhIGJsb2NrIGVsZW1lbnQgb3Igbm90LlxuICogT25seSB0YWtlcyBodG1sIG5vZGVzIGludG8gYWNjb3VudCB0aGF0IGFyZSBhbGxvd2VkIGluIG1hdHJpeCBtZXNzYWdlcy5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAqIEByZXR1cm5zIHtib29sfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tCbG9ja05vZGUobm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS5ub2RlTmFtZSkge1xuICAgICAgICBjYXNlIFwiSDFcIjpcbiAgICAgICAgY2FzZSBcIkgyXCI6XG4gICAgICAgIGNhc2UgXCJIM1wiOlxuICAgICAgICBjYXNlIFwiSDRcIjpcbiAgICAgICAgY2FzZSBcIkg1XCI6XG4gICAgICAgIGNhc2UgXCJINlwiOlxuICAgICAgICBjYXNlIFwiUFJFXCI6XG4gICAgICAgIGNhc2UgXCJCTE9DS1FVT1RFXCI6XG4gICAgICAgIGNhc2UgXCJESVZcIjpcbiAgICAgICAgY2FzZSBcIlBcIjpcbiAgICAgICAgY2FzZSBcIlVMXCI6XG4gICAgICAgIGNhc2UgXCJPTFwiOlxuICAgICAgICBjYXNlIFwiTElcIjpcbiAgICAgICAgY2FzZSBcIkhSXCI6XG4gICAgICAgIGNhc2UgXCJUQUJMRVwiOlxuICAgICAgICBjYXNlIFwiVEhFQURcIjpcbiAgICAgICAgY2FzZSBcIlRCT0RZXCI6XG4gICAgICAgIGNhc2UgXCJUUlwiOlxuICAgICAgICBjYXNlIFwiVEhcIjpcbiAgICAgICAgY2FzZSBcIlREXCI6XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG4iXX0=