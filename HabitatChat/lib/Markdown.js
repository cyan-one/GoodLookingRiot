"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _commonmark = _interopRequireDefault(require("commonmark"));

var _escape = _interopRequireDefault(require("lodash/escape"));

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
const ALLOWED_HTML_TAGS = ['sub', 'sup', 'del', 'u']; // These types of node are definitely text

const TEXT_NODES = ['text', 'softbreak', 'linebreak', 'paragraph', 'document'];

function is_allowed_html_tag(node) {
  // Regex won't work for tags with attrs, but we only
  // allow <del> anyway.
  const matches = /^<\/?(.*)>$/.exec(node.literal);

  if (matches && matches.length == 2) {
    const tag = matches[1];
    return ALLOWED_HTML_TAGS.indexOf(tag) > -1;
  }

  return false;
}

function html_if_tag_allowed(node) {
  if (is_allowed_html_tag(node)) {
    this.lit(node.literal);
    return;
  } else {
    this.lit((0, _escape.default)(node.literal));
  }
}
/*
 * Returns true if the parse output containing the node
 * comprises multiple block level elements (ie. lines),
 * or false if it is only a single line.
 */


function is_multi_line(node) {
  let par = node;

  while (par.parent) {
    par = par.parent;
  }

  return par.firstChild != par.lastChild;
}
/**
 * Class that wraps commonmark, adding the ability to see whether
 * a given message actually uses any markdown syntax or whether
 * it's plain text.
 */


class Markdown {
  constructor(input) {
    this.input = input;
    const parser = new _commonmark.default.Parser();
    this.parsed = parser.parse(this.input);
  }

  isPlainText() {
    const walker = this.parsed.walker();
    let ev;

    while (ev = walker.next()) {
      const node = ev.node;

      if (TEXT_NODES.indexOf(node.type) > -1) {
        // definitely text
        continue;
      } else if (node.type == 'html_inline' || node.type == 'html_block') {
        // if it's an allowed html tag, we need to render it and therefore
        // we will need to use HTML. If it's not allowed, it's not HTML since
        // we'll just be treating it as text.
        if (is_allowed_html_tag(node)) {
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  }

  toHTML({
    externalLinks = false
  } = {}) {
    const renderer = new _commonmark.default.HtmlRenderer({
      safe: false,
      // Set soft breaks to hard HTML breaks: commonmark
      // puts softbreaks in for multiple lines in a blockquote,
      // so if these are just newline characters then the
      // block quote ends up all on one line
      // (https://github.com/vector-im/riot-web/issues/3154)
      softbreak: '<br />'
    }); // Trying to strip out the wrapping <p/> causes a lot more complication
    // than it's worth, i think.  For instance, this code will go and strip
    // out any <p/> tag (no matter where it is in the tree) which doesn't
    // contain \n's.
    // On the flip side, <p/>s are quite opionated and restricted on where
    // you can nest them.
    //
    // Let's try sending with <p/>s anyway for now, though.

    const real_paragraph = renderer.paragraph;

    renderer.paragraph = function (node, entering) {
      // If there is only one top level node, just return the
      // bare text: it's a single line of text and so should be
      // 'inline', rather than unnecessarily wrapped in its own
      // p tag. If, however, we have multiple nodes, each gets
      // its own p tag to keep them as separate paragraphs.
      if (is_multi_line(node)) {
        real_paragraph.call(this, node, entering);
      }
    };

    renderer.link = function (node, entering) {
      const attrs = this.attrs(node);

      if (entering) {
        attrs.push(['href', this.esc(node.destination)]);

        if (node.title) {
          attrs.push(['title', this.esc(node.title)]);
        } // Modified link behaviour to treat them all as external and
        // thus opening in a new tab.


        if (externalLinks) {
          attrs.push(['target', '_blank']);
          attrs.push(['rel', 'noreferrer noopener']);
        }

        this.tag('a', attrs);
      } else {
        this.tag('/a');
      }
    };

    renderer.html_inline = html_if_tag_allowed;

    renderer.html_block = function (node) {
      /*
                  // as with `paragraph`, we only insert line breaks
                  // if there are multiple lines in the markdown.
                  const isMultiLine = is_multi_line(node);
                  if (isMultiLine) this.cr();
      */
      html_if_tag_allowed.call(this, node);
      /*
                  if (isMultiLine) this.cr();
      */
    };

    return renderer.render(this.parsed);
  }
  /*
   * Render the markdown message to plain text. That is, essentially
   * just remove any backslashes escaping what would otherwise be
   * markdown syntax
   * (to fix https://github.com/vector-im/riot-web/issues/2870).
   *
   * N.B. this does **NOT** render arbitrary MD to plain text - only MD
   * which has no formatting.  Otherwise it emits HTML(!).
   */


  toPlaintext() {
    const renderer = new _commonmark.default.HtmlRenderer({
      safe: false
    });
    const real_paragraph = renderer.paragraph; // The default `out` function only sends the input through an XML
    // escaping function, which causes messages to be entity encoded,
    // which we don't want in this case.

    renderer.out = function (s) {
      // The `lit` function adds a string literal to the output buffer.
      this.lit(s);
    };

    renderer.paragraph = function (node, entering) {
      // as with toHTML, only append lines to paragraphs if there are
      // multiple paragraphs
      if (is_multi_line(node)) {
        if (!entering && node.next) {
          this.lit('\n\n');
        }
      }
    };

    renderer.html_block = function (node) {
      this.lit(node.literal);
      if (is_multi_line(node) && node.next) this.lit('\n\n');
    };

    return renderer.render(this.parsed);
  }

}

exports.default = Markdown;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9NYXJrZG93bi5qcyJdLCJuYW1lcyI6WyJBTExPV0VEX0hUTUxfVEFHUyIsIlRFWFRfTk9ERVMiLCJpc19hbGxvd2VkX2h0bWxfdGFnIiwibm9kZSIsIm1hdGNoZXMiLCJleGVjIiwibGl0ZXJhbCIsImxlbmd0aCIsInRhZyIsImluZGV4T2YiLCJodG1sX2lmX3RhZ19hbGxvd2VkIiwibGl0IiwiaXNfbXVsdGlfbGluZSIsInBhciIsInBhcmVudCIsImZpcnN0Q2hpbGQiLCJsYXN0Q2hpbGQiLCJNYXJrZG93biIsImNvbnN0cnVjdG9yIiwiaW5wdXQiLCJwYXJzZXIiLCJjb21tb25tYXJrIiwiUGFyc2VyIiwicGFyc2VkIiwicGFyc2UiLCJpc1BsYWluVGV4dCIsIndhbGtlciIsImV2IiwibmV4dCIsInR5cGUiLCJ0b0hUTUwiLCJleHRlcm5hbExpbmtzIiwicmVuZGVyZXIiLCJIdG1sUmVuZGVyZXIiLCJzYWZlIiwic29mdGJyZWFrIiwicmVhbF9wYXJhZ3JhcGgiLCJwYXJhZ3JhcGgiLCJlbnRlcmluZyIsImNhbGwiLCJsaW5rIiwiYXR0cnMiLCJwdXNoIiwiZXNjIiwiZGVzdGluYXRpb24iLCJ0aXRsZSIsImh0bWxfaW5saW5lIiwiaHRtbF9ibG9jayIsInJlbmRlciIsInRvUGxhaW50ZXh0Iiwib3V0IiwicyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQWpCQTs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLE1BQU1BLGlCQUFpQixHQUFHLENBQUMsS0FBRCxFQUFRLEtBQVIsRUFBZSxLQUFmLEVBQXNCLEdBQXRCLENBQTFCLEMsQ0FFQTs7QUFDQSxNQUFNQyxVQUFVLEdBQUcsQ0FBQyxNQUFELEVBQVMsV0FBVCxFQUFzQixXQUF0QixFQUFtQyxXQUFuQyxFQUFnRCxVQUFoRCxDQUFuQjs7QUFFQSxTQUFTQyxtQkFBVCxDQUE2QkMsSUFBN0IsRUFBbUM7QUFDL0I7QUFDQTtBQUNBLFFBQU1DLE9BQU8sR0FBRyxjQUFjQyxJQUFk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UDtBQUNIO0FBRUQ7Ozs7Ozs7Ozs7O0FBU0EwQixFQUFBQSxXQUFXLEdBQUc7QUFDVixVQUFNakIsUUFBUSxHQUFHLElBQUlYLG9CQUFXWSxZQUFmLENBQTRCO0FBQUNDLE1BQUFBLElBQUksRUFBRTtBQUFQLEtBQTVCLENBQWpCO0FBQ0EsVUFBTUUsY0FBYyxHQUFHSixRQUFRLENBQUNLLFNBQWhDLENBRlUsQ0FJVjtBQUNBO0FBQ0E7O0FBQ0FMLElBQUFBLFFBQVEsQ0FBQ2tCLEdBQVQsR0FBZSxVQUFTQyxDQUFULEVBQVk7QUFDdkI7QUFDQSxXQUFLeEMsR0FBTCxDQUFTd0MsQ0FBVDtBQUNILEtBSEQ7O0FBS0FuQixJQUFBQSxRQUFRLENBQUNLLFNBQVQsR0FBcUIsVUFBU2xDLElBQVQsRUFBZW1DLFFBQWYsRUFBeUI7QUFDMUM7QUFDQTtBQUNBLFVBQUkxQixhQUFhLENBQUNULElBQUQsQ0FBakIsRUFBeUI7QUFDckIsWUFBSSxDQUFDbUMsUUFBRCxJQUFhbkMsSUFBSSxDQUFDeUIsSUFBdEIsRUFBNEI7QUFDeEIsZUFBS2pCLEdBQUwsQ0FBUyxNQUFUO0FBQ0g7QUFDSjtBQUNKLEtBUkQ7O0FBVUFxQixJQUFBQSxRQUFRLENBQUNlLFVBQVQsR0FBc0IsVUFBUzVDLElBQVQsRUFBZTtBQUNqQyxXQUFLUSxHQUFMLENBQVNSLElBQUksQ0FBQ0csT0FBZDtBQUNBLFVBQUlNLGFBQWEsQ0FBQ1QsSUFBRCxDQUFiLElBQXVCQSxJQUFJLENBQUN5QixJQUFoQyxFQUFzQyxLQUFLakIsR0FBTCxDQUFTLE1BQVQ7QUFDekMsS0FIRDs7QUFLQSxXQUFPcUIsUUFBUSxDQUFDZ0IsTUFBVCxDQUFnQixLQUFLekIsTUFBckIsQ0FBUDtBQUNIOztBQTNJeUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTYgT3Blbk1hcmtldCBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgY29tbW9ubWFyayBmcm9tICdjb21tb25tYXJrJztcbmltcG9ydCBlc2NhcGUgZnJvbSAnbG9kYXNoL2VzY2FwZSc7XG5cbmNvbnN0IEFMTE9XRURfSFRNTF9UQUdTID0gWydzdWInLCAnc3VwJywgJ2RlbCcsICd1J107XG5cbi8vIFRoZXNlIHR5cGVzIG9mIG5vZGUgYXJlIGRlZmluaXRlbHkgdGV4dFxuY29uc3QgVEVYVF9OT0RFUyA9IFsndGV4dCcsICdzb2Z0YnJlYWsnLCAnbGluZWJyZWFrJywgJ3BhcmFncmFwaCcsICdkb2N1bWVudCddO1xuXG5mdW5jdGlvbiBpc19hbGxvd2VkX2h0bWxfdGFnKG5vZGUpIHtcbiAgICAvLyBSZWdleCB3b24ndCB3b3JrIGZvciB0YWdzIHdpdGggYXR0cnMsIGJ1dCB3ZSBvbmx5XG4gICAgLy8gYWxsb3cgPGRlbD4gYW55d2F5LlxuICAgIGNvbnN0IG1hdGNoZXMgPSAvXjxcXC8/KC4qKT4kLy5leGVjKG5vZGUubGl0ZXJhbCk7XG4gICAgaWYgKG1hdGNoZXMgJiYgbWF0Y2hlcy5sZW5ndGggPT0gMikge1xuICAgICAgICBjb25zdCB0YWcgPSBtYXRjaGVzWzFdO1xuICAgICAgICByZXR1cm4gQUxMT1dFRF9IVE1MX1RBR1MuaW5kZXhPZih0YWcpID4gLTE7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaHRtbF9pZl90YWdfYWxsb3dlZChub2RlKSB7XG4gICAgaWYgKGlzX2FsbG93ZWRfaHRtbF90YWcobm9kZSkpIHtcbiAgICAgICAgdGhpcy5saXQobm9kZS5saXRlcmFsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubGl0KGVzY2FwZShub2RlLmxpdGVyYWwpKTtcbiAgICB9XG59XG5cbi8qXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIHBhcnNlIG91dHB1dCBjb250YWluaW5nIHRoZSBub2RlXG4gKiBjb21wcmlzZXMgbXVsdGlwbGUgYmxvY2sgbGV2ZWwgZWxlbWVudHMgKGllLiBsaW5lcyksXG4gKiBvciBmYWxzZSBpZiBpdCBpcyBvbmx5IGEgc2luZ2xlIGxpbmUuXG4gKi9cbmZ1bmN0aW9uIGlzX211bHRpX2xpbmUobm9kZSkge1xuICAgIGxldCBwYXIgPSBub2RlO1xuICAgIHdoaWxlIChwYXIucGFyZW50KSB7XG4gICAgICAgIHBhciA9IHBhci5wYXJlbnQ7XG4gICAgfVxuICAgIHJldHVybiBwYXIuZmlyc3RDaGlsZCAhPSBwYXIubGFzdENoaWxkO1xufVxuXG4vKipcbiAqIENsYXNzIHRoYXQgd3JhcHMgY29tbW9ubWFyaywgYWRkaW5nIHRoZSBhYmlsaXR5IHRvIHNlZSB3aGV0aGVyXG4gKiBhIGdpdmVuIG1lc3NhZ2UgYWN0dWFsbHkgdXNlcyBhbnkgbWFya2Rvd24gc3ludGF4IG9yIHdoZXRoZXJcbiAqIGl0J3MgcGxhaW4gdGV4dC5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWFya2Rvd24ge1xuICAgIGNvbnN0cnVjdG9yKGlucHV0KSB7XG4gICAgICAgIHRoaXMuaW5wdXQgPSBpbnB1dDtcblxuICAgICAgICBjb25zdCBwYXJzZXIgPSBuZXcgY29tbW9ubWFyay5QYXJzZXIoKTtcbiAgICAgICAgdGhpcy5wYXJzZWQgPSBwYXJzZXIucGFyc2UodGhpcy5pbnB1dCk7XG4gICAgfVxuXG4gICAgaXNQbGFpblRleHQoKSB7XG4gICAgICAgIGNvbnN0IHdhbGtlciA9IHRoaXMucGFyc2VkLndhbGtlcigpO1xuXG4gICAgICAgIGxldCBldjtcbiAgICAgICAgd2hpbGUgKCAoZXYgPSB3YWxrZXIubmV4dCgpKSApIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBldi5ub2RlO1xuICAgICAgICAgICAgaWYgKFRFWFRfTk9ERVMuaW5kZXhPZihub2RlLnR5cGUpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyBkZWZpbml0ZWx5IHRleHRcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobm9kZS50eXBlID09ICdodG1sX2lubGluZScgfHwgbm9kZS50eXBlID09ICdodG1sX2Jsb2NrJykge1xuICAgICAgICAgICAgICAgIC8vIGlmIGl0J3MgYW4gYWxsb3dlZCBodG1sIHRhZywgd2UgbmVlZCB0byByZW5kZXIgaXQgYW5kIHRoZXJlZm9yZVxuICAgICAgICAgICAgICAgIC8vIHdlIHdpbGwgbmVlZCB0byB1c2UgSFRNTC4gSWYgaXQncyBub3QgYWxsb3dlZCwgaXQncyBub3QgSFRNTCBzaW5jZVxuICAgICAgICAgICAgICAgIC8vIHdlJ2xsIGp1c3QgYmUgdHJlYXRpbmcgaXQgYXMgdGV4dC5cbiAgICAgICAgICAgICAgICBpZiAoaXNfYWxsb3dlZF9odG1sX3RhZyhub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdG9IVE1MKHsgZXh0ZXJuYWxMaW5rcyA9IGZhbHNlIH0gPSB7fSkge1xuICAgICAgICBjb25zdCByZW5kZXJlciA9IG5ldyBjb21tb25tYXJrLkh0bWxSZW5kZXJlcih7XG4gICAgICAgICAgICBzYWZlOiBmYWxzZSxcblxuICAgICAgICAgICAgLy8gU2V0IHNvZnQgYnJlYWtzIHRvIGhhcmQgSFRNTCBicmVha3M6IGNvbW1vbm1hcmtcbiAgICAgICAgICAgIC8vIHB1dHMgc29mdGJyZWFrcyBpbiBmb3IgbXVsdGlwbGUgbGluZXMgaW4gYSBibG9ja3F1b3RlLFxuICAgICAgICAgICAgLy8gc28gaWYgdGhlc2UgYXJlIGp1c3QgbmV3bGluZSBjaGFyYWN0ZXJzIHRoZW4gdGhlXG4gICAgICAgICAgICAvLyBibG9jayBxdW90ZSBlbmRzIHVwIGFsbCBvbiBvbmUgbGluZVxuICAgICAgICAgICAgLy8gKGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC13ZWIvaXNzdWVzLzMxNTQpXG4gICAgICAgICAgICBzb2Z0YnJlYWs6ICc8YnIgLz4nLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBUcnlpbmcgdG8gc3RyaXAgb3V0IHRoZSB3cmFwcGluZyA8cC8+IGNhdXNlcyBhIGxvdCBtb3JlIGNvbXBsaWNhdGlvblxuICAgICAgICAvLyB0aGFuIGl0J3Mgd29ydGgsIGkgdGhpbmsuICBGb3IgaW5zdGFuY2UsIHRoaXMgY29kZSB3aWxsIGdvIGFuZCBzdHJpcFxuICAgICAgICAvLyBvdXQgYW55IDxwLz4gdGFnIChubyBtYXR0ZXIgd2hlcmUgaXQgaXMgaW4gdGhlIHRyZWUpIHdoaWNoIGRvZXNuJ3RcbiAgICAgICAgLy8gY29udGFpbiBcXG4ncy5cbiAgICAgICAgLy8gT24gdGhlIGZsaXAgc2lkZSwgPHAvPnMgYXJlIHF1aXRlIG9waW9uYXRlZCBhbmQgcmVzdHJpY3RlZCBvbiB3aGVyZVxuICAgICAgICAvLyB5b3UgY2FuIG5lc3QgdGhlbS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gTGV0J3MgdHJ5IHNlbmRpbmcgd2l0aCA8cC8+cyBhbnl3YXkgZm9yIG5vdywgdGhvdWdoLlxuXG4gICAgICAgIGNvbnN0IHJlYWxfcGFyYWdyYXBoID0gcmVuZGVyZXIucGFyYWdyYXBoO1xuXG4gICAgICAgIHJlbmRlcmVyLnBhcmFncmFwaCA9IGZ1bmN0aW9uKG5vZGUsIGVudGVyaW5nKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBvbmx5IG9uZSB0b3AgbGV2ZWwgbm9kZSwganVzdCByZXR1cm4gdGhlXG4gICAgICAgICAgICAvLyBiYXJlIHRleHQ6IGl0J3MgYSBzaW5nbGUgbGluZSBvZiB0ZXh0IGFuZCBzbyBzaG91bGQgYmVcbiAgICAgICAgICAgIC8vICdpbmxpbmUnLCByYXRoZXIgdGhhbiB1bm5lY2Vzc2FyaWx5IHdyYXBwZWQgaW4gaXRzIG93blxuICAgICAgICAgICAgLy8gcCB0YWcuIElmLCBob3dldmVyLCB3ZSBoYXZlIG11bHRpcGxlIG5vZGVzLCBlYWNoIGdldHNcbiAgICAgICAgICAgIC8vIGl0cyBvd24gcCB0YWcgdG8ga2VlcCB0aGVtIGFzIHNlcGFyYXRlIHBhcmFncmFwaHMuXG4gICAgICAgICAgICBpZiAoaXNfbXVsdGlfbGluZShub2RlKSkge1xuICAgICAgICAgICAgICAgIHJlYWxfcGFyYWdyYXBoLmNhbGwodGhpcywgbm9kZSwgZW50ZXJpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJlbmRlcmVyLmxpbmsgPSBmdW5jdGlvbihub2RlLCBlbnRlcmluZykge1xuICAgICAgICAgICAgY29uc3QgYXR0cnMgPSB0aGlzLmF0dHJzKG5vZGUpO1xuICAgICAgICAgICAgaWYgKGVudGVyaW5nKSB7XG4gICAgICAgICAgICAgICAgYXR0cnMucHVzaChbJ2hyZWYnLCB0aGlzLmVzYyhub2RlLmRlc3RpbmF0aW9uKV0pO1xuICAgICAgICAgICAgICAgIGlmIChub2RlLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGF0dHJzLnB1c2goWyd0aXRsZScsIHRoaXMuZXNjKG5vZGUudGl0bGUpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIE1vZGlmaWVkIGxpbmsgYmVoYXZpb3VyIHRvIHRyZWF0IHRoZW0gYWxsIGFzIGV4dGVybmFsIGFuZFxuICAgICAgICAgICAgICAgIC8vIHRodXMgb3BlbmluZyBpbiBhIG5ldyB0YWIuXG4gICAgICAgICAgICAgICAgaWYgKGV4dGVybmFsTGlua3MpIHtcbiAgICAgICAgICAgICAgICAgICAgYXR0cnMucHVzaChbJ3RhcmdldCcsICdfYmxhbmsnXSk7XG4gICAgICAgICAgICAgICAgICAgIGF0dHJzLnB1c2goWydyZWwnLCAnbm9yZWZlcnJlciBub29wZW5lciddKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy50YWcoJ2EnLCBhdHRycyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudGFnKCcvYScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJlbmRlcmVyLmh0bWxfaW5saW5lID0gaHRtbF9pZl90YWdfYWxsb3dlZDtcblxuICAgICAgICByZW5kZXJlci5odG1sX2Jsb2NrID0gZnVuY3Rpb24obm9kZSkge1xuLypcbiAgICAgICAgICAgIC8vIGFzIHdpdGggYHBhcmFncmFwaGAsIHdlIG9ubHkgaW5zZXJ0IGxpbmUgYnJlYWtzXG4gICAgICAgICAgICAvLyBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgbGluZXMgaW4gdGhlIG1hcmtkb3duLlxuICAgICAgICAgICAgY29uc3QgaXNNdWx0aUxpbmUgPSBpc19tdWx0aV9saW5lKG5vZGUpO1xuICAgICAgICAgICAgaWYgKGlzTXVsdGlMaW5lKSB0aGlzLmNyKCk7XG4qL1xuICAgICAgICAgICAgaHRtbF9pZl90YWdfYWxsb3dlZC5jYWxsKHRoaXMsIG5vZGUpO1xuLypcbiAgICAgICAgICAgIGlmIChpc011bHRpTGluZSkgdGhpcy5jcigpO1xuKi9cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gcmVuZGVyZXIucmVuZGVyKHRoaXMucGFyc2VkKTtcbiAgICB9XG5cbiAgICAvKlxuICAgICAqIFJlbmRlciB0aGUgbWFya2Rvd24gbWVzc2FnZSB0byBwbGFpbiB0ZXh0LiBUaGF0IGlzLCBlc3NlbnRpYWxseVxuICAgICAqIGp1c3QgcmVtb3ZlIGFueSBiYWNrc2xhc2hlcyBlc2NhcGluZyB3aGF0IHdvdWxkIG90aGVyd2lzZSBiZVxuICAgICAqIG1hcmtkb3duIHN5bnRheFxuICAgICAqICh0byBmaXggaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS9yaW90LXdlYi9pc3N1ZXMvMjg3MCkuXG4gICAgICpcbiAgICAgKiBOLkIuIHRoaXMgZG9lcyAqKk5PVCoqIHJlbmRlciBhcmJpdHJhcnkgTUQgdG8gcGxhaW4gdGV4dCAtIG9ubHkgTURcbiAgICAgKiB3aGljaCBoYXMgbm8gZm9ybWF0dGluZy4gIE90aGVyd2lzZSBpdCBlbWl0cyBIVE1MKCEpLlxuICAgICAqL1xuICAgIHRvUGxhaW50ZXh0KCkge1xuICAgICAgICBjb25zdCByZW5kZXJlciA9IG5ldyBjb21tb25tYXJrLkh0bWxSZW5kZXJlcih7c2FmZTogZmFsc2V9KTtcbiAgICAgICAgY29uc3QgcmVhbF9wYXJhZ3JhcGggPSByZW5kZXJlci5wYXJhZ3JhcGg7XG5cbiAgICAgICAgLy8gVGhlIGRlZmF1bHQgYG91dGAgZnVuY3Rpb24gb25seSBzZW5kcyB0aGUgaW5wdXQgdGhyb3VnaCBhbiBYTUxcbiAgICAgICAgLy8gZXNjYXBpbmcgZnVuY3Rpb24sIHdoaWNoIGNhdXNlcyBtZXNzYWdlcyB0byBiZSBlbnRpdHkgZW5jb2RlZCxcbiAgICAgICAgLy8gd2hpY2ggd2UgZG9uJ3Qgd2FudCBpbiB0aGlzIGNhc2UuXG4gICAgICAgIHJlbmRlcmVyLm91dCA9IGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgIC8vIFRoZSBgbGl0YCBmdW5jdGlvbiBhZGRzIGEgc3RyaW5nIGxpdGVyYWwgdG8gdGhlIG91dHB1dCBidWZmZXIuXG4gICAgICAgICAgICB0aGlzLmxpdChzKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZW5kZXJlci5wYXJhZ3JhcGggPSBmdW5jdGlvbihub2RlLCBlbnRlcmluZykge1xuICAgICAgICAgICAgLy8gYXMgd2l0aCB0b0hUTUwsIG9ubHkgYXBwZW5kIGxpbmVzIHRvIHBhcmFncmFwaHMgaWYgdGhlcmUgYXJlXG4gICAgICAgICAgICAvLyBtdWx0aXBsZSBwYXJhZ3JhcGhzXG4gICAgICAgICAgICBpZiAoaXNfbXVsdGlfbGluZShub2RlKSkge1xuICAgICAgICAgICAgICAgIGlmICghZW50ZXJpbmcgJiYgbm9kZS5uZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGl0KCdcXG5cXG4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmVuZGVyZXIuaHRtbF9ibG9jayA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMubGl0KG5vZGUubGl0ZXJhbCk7XG4gICAgICAgICAgICBpZiAoaXNfbXVsdGlfbGluZShub2RlKSAmJiBub2RlLm5leHQpIHRoaXMubGl0KCdcXG5cXG4nKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gcmVuZGVyZXIucmVuZGVyKHRoaXMucGFyc2VkKTtcbiAgICB9XG59XG4iXX0=