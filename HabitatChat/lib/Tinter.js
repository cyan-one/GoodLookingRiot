"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*
Copyright 2015 OpenMarket Ltd
Copyright 2017 New Vector Ltd

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
const DEBUG = 0; // utility to turn #rrggbb or rgb(r,g,b) into [red,green,blue]

function colorToRgb(color) {
  if (!color) {
    return [0, 0, 0];
  }

  if (color[0] === '#') {
    color = color.slice(1);

    if (color.length === 3) {
      color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }

    const val = parseInt(color, 16);
    const r = val >> 16 & 255;
    const g = val >> 8 & 255;
    const b = val & 255;
    return [r, g, b];
  } else {
    const match = color.match(/rgb\((.*?),(.*?),(.*?)\)/);

    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
  }

  return [0, 0, 0];
} // utility to turn [red,green,blue] into #rrggbb


function rgbToColor(rgb) {
  const val = rgb[0] << 16 | rgb[1] << 8 | rgb[2];
  return '#' + (0x1000000 + val).toString(16).slice(1);
}

class Tinter {
  constructor() {
    // The default colour keys to be replaced as referred to in CSS
    // (should be overridden by .mx_theme_accentColor and .mx_theme_secondaryAccentColor)
    this.keyRgb = ["rgb(118, 207, 166)", // Vector Green
    "rgb(234, 245, 240)", // Vector Light Green
    "rgb(211, 239, 225)" // roomsublist-label-bg-color (20% Green overlaid on Light Green)
    ]; // Some algebra workings for calculating the tint % of Vector Green & Light Green
    // x * 118 + (1 - x) * 255 = 234
    // x * 118 + 255 - 255 * x = 234
    // x * 118 - x * 255 = 234 - 255
    // (255 - 118) x = 255 - 234
    // x = (255 - 234) / (255 - 118) = 0.16
    // The colour keys to be replaced as referred to in SVGs

    this.keyHex = ["#76CFA6", // Vector Green
    "#EAF5F0", // Vector Light Green
    "#D3EFE1", // roomsublist-label-bg-color (20% Green overlaid on Light Green)
    "#FFFFFF", // white highlights of the SVGs (for switching to dark theme)
    "#000000" // black lowlights of the SVGs (for switching to dark theme)
    ]; // track the replacement colours actually being used
    // defaults to our keys.

    this.colors = [this.keyHex[0], this.keyHex[1], this.keyHex[2], this.keyHex[3], this.keyHex[4]]; // track the most current tint request inputs (which may differ from the
    // end result stored in this.colors

    this.currentTint = [undefined, undefined, undefined, undefined, undefined];
    this.cssFixups = [// { theme: {
      //      style: a style object that should be fixed up taken from a stylesheet
      //      attr: name of the attribute to be clobbered, e.g. 'color'
      //      index: ordinal of primary, secondary or tertiary
      //   },
      // }
    ]; // CSS attributes to be fixed up

    this.cssAttrs = ["color", "backgroundColor", "borderColor", "borderTopColor", "borderBottomColor", "borderLeftColor"];
    this.svgAttrs = ["fill", "stroke"]; // List of functions to call when the tint changes.

    this.tintables = []; // the currently loaded theme (if any)

    this.theme = undefined; // whether to force a tint (e.g. after changing theme)

    this.forceTint = false;
  }
  /**
   * Register a callback to fire when the tint changes.
   * This is used to rewrite the tintable SVGs with the new tint.
   *
   * It's not possible to unregister a tintable callback. So this can only be
   * used to register a static callback. If a set of tintables will change
   * over time then the best bet is to register a single callback for the
   * entire set.
   *
   * To ensure the tintable work happens at least once, it is also called as
   * part of registration.
   *
   * @param {Function} tintable Function to call when the tint changes.
   */


  registerTintable(tintable) {
    this.tintables.push(tintable);
    tintable();
  }

  getKeyRgb() {
    return this.keyRgb;
  }

  tint(primaryColor, secondaryColor, tertiaryColor) {
    return; // eslint-disable-next-line no-unreachable

    this.currentTint[0] = primaryColor;
    this.currentTint[1] = secondaryColor;
    this.currentTint[2] = tertiaryColor;
    this.calcCssFixups();

    if (DEBUG) {
      console.log("Tinter.tint(" + primaryColor + ", " + secondaryColor + ", " + tertiaryColor + ")");
    }

    if (!primaryColor) {
      primaryColor = this.keyRgb[0];
      secondaryColor = this.keyRgb[1];
      tertiaryColor = this.keyRgb[2];
    }

    if (!secondaryColor) {
      const x = 0.16; // average weighting factor calculated from vector green & light green

      const rgb = colorToRgb(primaryColor);
      rgb[0] = x * rgb[0] + (1 - x) * 255;
      rgb[1] = x * rgb[1] + (1 - x) * 255;
      rgb[2] = x * rgb[2] + (1 - x) * 255;
      secondaryColor = rgbToColor(rgb);
    }

    if (!tertiaryColor) {
      const x = 0.19;
      const rgb1 = colorToRgb(primaryColor);
      const rgb2 = colorToRgb(secondaryColor);
      rgb1[0] = x * rgb1[0] + (1 - x) * rgb2[0];
      rgb1[1] = x * rgb1[1] + (1 - x) * rgb2[1];
      rgb1[2] = x * rgb1[2] + (1 - x) * rgb2[2];
      tertiaryColor = rgbToColor(rgb1);
    }

    if (this.forceTint == false && this.colors[0] === primaryColor && this.colors[1] === secondaryColor && this.colors[2] === tertiaryColor) {
      return;
    }

    this.forceTint = false;
    this.colors[0] = primaryColor;
    this.colors[1] = secondaryColor;
    this.colors[2] = tertiaryColor;

    if (DEBUG) {
      console.log("Tinter.tint final: (" + primaryColor + ", " + secondaryColor + ", " + tertiaryColor + ")");
    } // go through manually fixing up the stylesheets.


    this.applyCssFixups(); // tell all the SVGs to go fix themselves up
    // we don't do this as a dispatch otherwise it will visually lag

    this.tintables.forEach(function (tintable) {
      tintable();
    });
  }

  tintSvgWhite(whiteColor) {
    this.currentTint[3] = whiteColor;

    if (!whiteColor) {
      whiteColor = this.colors[3];
    }

    if (this.colors[3] === whiteColor) {
      return;
    }

    this.colors[3] = whiteColor;
    this.tintables.forEach(function (tintable) {
      tintable();
    });
  }

  tintSvgBlack(blackColor) {
    this.currentTint[4] = blackColor;

    if (!blackColor) {
      blackColor = this.colors[4];
    }

    if (this.colors[4] === blackColor) {
      return;
    }

    this.colors[4] = blackColor;
    this.tintables.forEach(function (tintable) {
      tintable();
    });
  }

  setTheme(theme) {
    this.theme = theme; // update keyRgb from the current theme CSS itself, if it defines it

    if (document.getElementById('mx_theme_accentColor')) {
      this.keyRgb[0] = window.getComputedStyle(document.getElementById('mx_theme_accentColor')).color;
    }

    if (document.getElementById('mx_theme_secondaryAccentColor')) {
      this.keyRgb[1] = window.getComputedStyle(document.getElementById('mx_theme_secondaryAccentColor')).color;
    }

    if (document.getElementById('mx_theme_tertiaryAccentColor')) {
      this.keyRgb[2] = window.getComputedStyle(document.getElementById('mx_theme_tertiaryAccentColor')).color;
    }

    this.calcCssFixups();
    this.forceTint = true;
    this.tint(this.currentTint[0], this.currentTint[1], this.currentTint[2]);

    if (theme === 'dark') {
      // abuse the tinter to change all the SVG's #fff to #2d2d2d
      // XXX: obviously this shouldn't be hardcoded here.
      this.tintSvgWhite('#2d2d2d');
      this.tintSvgBlack('#dddddd');
    } else {
      this.tintSvgWhite('#ffffff');
      this.tintSvgBlack('#000000');
    }
  }

  calcCssFixups() {
    // cache our fixups
    if (this.cssFixups[this.theme]) return;

    if (DEBUG) {
      console.debug("calcCssFixups start for " + this.theme + " (checking " + document.styleSheets.length + " stylesheets)");
    }

    this.cssFixups[this.theme] = [];

    for (let i = 0; i < document.styleSheets.length; i++) {
      const ss = document.styleSheets[i];

      try {
        if (!ss) continue; // well done safari >:(
        // Chromium apparently sometimes returns null here; unsure why.
        // see $14534907369972FRXBx:matrix.org in HQ
        // ...ah, it's because there's a third party extension like
        // privacybadger inserting its own stylesheet in there with a
        // resource:// URI or something which results in a XSS error.
        // See also #vector:matrix.org/$145357669685386ebCfr:matrix.org
        // ...except some browsers apparently return stylesheets without
        // hrefs, which we have no choice but ignore right now
        // XXX seriously? we are hardcoding the name of vector's CSS file in
        // here?
        //
        // Why do we need to limit it to vector's CSS file anyway - if there
        // are other CSS files affecting the doc don't we want to apply the
        // same transformations to them?
        //
        // Iterating through the CSS looking for matches to hack on feels
        // pretty horrible anyway. And what if the application skin doesn't use
        // Vector Green as its primary color?
        // --richvdh
        // Yes, tinting assumes that you are using the Riot skin for now.
        // The right solution will be to move the CSS over to react-sdk.
        // And yes, the default assets for the base skin might as well use
        // Vector Green as any other colour.
        // --matthew
        // stylesheets we don't have permission to access (eg. ones from extensions) have a null
        // href and will throw exceptions if we try to access their rules.

        if (!ss.href || !ss.href.match(new RegExp('/theme-' + this.theme + '.css$'))) continue;
        if (ss.disabled) continue;
        if (!ss.cssRules) continue;
        if (DEBUG) console.debug("calcCssFixups checking " + ss.cssRules.length + " rules for " + ss.href);

        for (let j = 0; j < ss.cssRules.length; j++) {
          const rule = ss.cssRules[j];
          if (!rule.style) continue;
          if (rule.selectorText && rule.selectorText.match(/#mx_theme/)) continue;

          for (let k = 0; k < this.cssAttrs.length; k++) {
            const attr = this.cssAttrs[k];

            for (let l = 0; l < this.keyRgb.length; l++) {
              if (rule.style[attr] === this.keyRgb[l]) {
                this.cssFixups[this.theme].push({
                  style: rule.style,
                  attr: attr,
                  index: l
                });
              }
            }
          }
        }
      } catch (e) {
        // Catch any random exceptions that happen here: all sorts of things can go
        // wrong with this (nulls, SecurityErrors) and mostly it's for other
        // stylesheets that we don't want to proces anyway. We should not propagate an
        // exception out since this will cause the app to fail to start.
        console.log("Failed to calculate CSS fixups for a stylesheet: " + ss.href, e);
      }
    }

    if (DEBUG) {
      console.log("calcCssFixups end (" + this.cssFixups[this.theme].length + " fixups)");
    }
  }

  applyCssFixups() {
    if (DEBUG) {
      console.log("applyCssFixups start (" + this.cssFixups[this.theme].length + " fixups)");
    }

    for (let i = 0; i < this.cssFixups[this.theme].length; i++) {
      const cssFixup = this.cssFixups[this.theme][i];

      try {
        cssFixup.style[cssFixup.attr] = this.colors[cssFixup.index];
      } catch (e) {
        // Firefox Quantum explodes if you manually edit the CSS in the
        // inspector and then try to do a tint, as apparently all the
        // fixups are then stale.
        console.error("Failed to apply cssFixup in Tinter! ", e.name);
      }
    }

    if (DEBUG) console.log("applyCssFixups end");
  } // XXX: we could just move this all into TintableSvg, but as it's so similar
  // to the CSS fixup stuff in Tinter (just that the fixups are stored in TintableSvg)
  // keeping it here for now.


  calcSvgFixups(svgs) {
    // go through manually fixing up SVG colours.
    // we could do this by stylesheets, but keeping the stylesheets
    // updated would be a PITA, so just brute-force search for the
    // key colour; cache the element and apply.
    if (DEBUG) console.log("calcSvgFixups start for " + svgs);
    const fixups = [];

    for (let i = 0; i < svgs.length; i++) {
      let svgDoc;

      try {
        svgDoc = svgs[i].contentDocument;
      } catch (e) {
        let msg = 'Failed to get svg.contentDocument of ' + svgs[i].toString();

        if (e.message) {
          msg += e.message;
        }

        if (e.stack) {
          msg += ' | stack: ' + e.stack;
        }

        console.error(msg);
      }

      if (!svgDoc) continue;
      const tags = svgDoc.getElementsByTagName("*");

      for (let j = 0; j < tags.length; j++) {
        const tag = tags[j];

        for (let k = 0; k < this.svgAttrs.length; k++) {
          const attr = this.svgAttrs[k];

          for (let l = 0; l < this.keyHex.length; l++) {
            if (tag.getAttribute(attr) && tag.getAttribute(attr).toUpperCase() === this.keyHex[l]) {
              fixups.push({
                node: tag,
                attr: attr,
                index: l
              });
            }
          }
        }
      }
    }

    if (DEBUG) console.log("calcSvgFixups end");
    return fixups;
  }

  applySvgFixups(fixups) {
    if (DEBUG) console.log("applySvgFixups start for " + fixups);

    for (let i = 0; i < fixups.length; i++) {
      const svgFixup = fixups[i];
      svgFixup.node.setAttribute(svgFixup.attr, this.colors[svgFixup.index]);
    }

    if (DEBUG) console.log("applySvgFixups end");
  }

}

if (global.singletonTinter === undefined) {
  global.singletonTinter = new Tinter();
}

var _default = global.singletonTinter;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9UaW50ZXIuanMiXSwibmFtZXMiOlsiREVCVUciLCJjb2xvclRvUmdiIiwiY29sb3IiLCJzbGljZSIsImxlbmd0aCIsInZhbCIsInBhcnNlSW50IiwiciIsImciLCJiIiwibWF0Y2giLCJyZ2JUb0NvbG9yIiwicmdiIiwidG9TdHJpbmciLCJUaW50ZXIiLCJjb25zdHJ1Y3RvciIsImtleVJnYiIsImtleUhleCIsImNvbG9ycyIsImN1cnJlbnRUaW50IiwidW5kZWZpbmVkIiwiY3NzRml4dXBzIiwiY3NzQXR0cnMiLCJzdmdBdHRycyIsInRpbnRhYmxlcyIsInRoZW1lIiwiZm9yY2VUaW50IiwicmVnaXN0ZXJUaW50YWJsZSIsInRpbnRhYmxlIiwicHVzaCIsImdldEtleVJnYiIsInRpbnQiLCJwcmltYXJ5Q29sb3IiLCJzZWNvbmRhcnlDb2xvciIsInRlcnRpYXJ5Q29sb3IiLCJjYWxjQ3NzRml4dXBzIiwiY29uc29sZSIsImxvZyIsIngiLCJyZ2IxIiwicmdiMiIsImFwcGx5Q3NzRml4dXBzIiwiZm9yRWFjaCIsInRpbnRTdmdXaGl0ZSIsIndoaXRlQ29sb3IiLCJ0aW50U3ZnQmxhY2siLCJibGFja0NvbG9yIiwic2V0VGhlbWUiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwid2luZG93IiwiZ2V0Q29tcHV0ZWRTdHlsZSIsImRlYnVnIiwic3R5bGVTaGVldHMiLCJpIiwic3MiLCJocmVmIiwiUmVnRXhwIiwiZGlzYWJsZWQiLCJjc3NSdWxlcyIsImoiLCJydWxlIiwic3R5bGUiLCJzZWxlY3RvclRleHQiLCJrIiwiYXR0ciIsImwiLCJpbmRleCIsImUiLCJjc3NGaXh1cCIsImVycm9yIiwibmFtZSIsImNhbGNTdmdGaXh1cHMiLCJzdmdzIiwiZml4dXBzIiwic3ZnRG9jIiwiY29udGVudERvY3VtZW50IiwibXNnIiwibWVzc2FnZSIsInN0YWNrIiwidGFncyIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwidGFnIiwiZ2V0QXR0cmlidXRlIiwidG9VcHBlckNhc2UiLCJub2RlIiwiYXBwbHlTdmdGaXh1cHMiLCJzdmdGaXh1cCIsInNldEF0dHJpYnV0ZSIsImdsb2JhbCIsInNpbmdsZXRvblRpbnRlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBLE1BQU1BLEtBQUssR0FBRyxDQUFkLEMsQ0FFQTs7QUFDQSxTQUFTQyxVQUFULENBQW9CQyxLQUFwQixFQUEyQjtBQUN2QixNQUFJLENBQUNBLEtBQUwsRUFBWTtBQUNSLFdBQU8sQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsQ0FBUDtBQUNIOztBQUVELE1BQUlBLEtBQUssQ0FBQyxDQUFELENBQUwsS0FBYSxHQUFqQixFQUFzQjtBQUNsQkEsSUFBQUEsS0FBSyxHQUFHQSxLQUFLLENBQUNDLEtBQU4sQ0FBWSxDQUFaLENBQVI7O0FBQ0EsUUFBSUQsS0FBSyxDQUFDRSxNQUFOLEtBQWlCLENBQXJCLEVBQXdCO0FBQ3BCRixNQUFBQSxLQUFLLEdBQUdBLEtBQUssQ0FBQyxDQUFELENBQUwsR0FBV0EsS0FBSyxDQUFDLENBQUQsQ0FBaEIsR0FDQUEsS0FBSyxDQUFDLENBQUQsQ0FETCxHQUNXQSxLQUFLLENBQUMsQ0FBRCxDQURoQixHQUVBQSxLQUFLLENBQUMsQ0FBRCxDQUZMLEdBRVdBLEtBQUssQ0FBQyxDQUFELENBRnhCO0FBR0g7O0FBQ0QsVUFBTUcsR0FBRyxHQUFHQyxRQUFRLENBQUNKLEtBQUQsRUFBUSxFQUFSLENBQXBCO0FBQ0EsVUFBTUssQ0FBQyxHQUFJRixHQUFHLElBQUksRUFBUixHQUFjLEdBQXhCO0FBQ0EsVUFBTUcsQ0FBQyxHQUFJSCxHQUFHLElBQUksQ0FBUixHQUFhLEdBQXZCO0FBQ0EsVUFBTUksQ0FBQyxHQUFHSixHQUFHLEdBQUcsR0FBaEI7QUFDQSxXQUFPLENBQUNFLENBQUQsRUFBSUMsQ0FBSixFQUFPQyxDQUFQLENBQVA7QUFDSCxHQVpELE1BWU87QUFDSCxVQUFNQyxLQUFLLEdBQUdSLEtBQUssQ0FBQ1EsS0FB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OztBQThZYixJQUFJb0QsTUFBTSxDQUFDQyxlQUFQLEtBQTJCdEUsU0FBL0IsRUFBMEM7QUFDdENxRSxFQUFBQSxNQUFNLENBQUNDLGVBQVAsR0FBeUIsSUFBSTVFLE1BQUosRUFBekI7QUFDSDs7ZUFDYzJFLE1BQU0sQ0FBQ0MsZSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTcgTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5jb25zdCBERUJVRyA9IDA7XG5cbi8vIHV0aWxpdHkgdG8gdHVybiAjcnJnZ2JiIG9yIHJnYihyLGcsYikgaW50byBbcmVkLGdyZWVuLGJsdWVdXG5mdW5jdGlvbiBjb2xvclRvUmdiKGNvbG9yKSB7XG4gICAgaWYgKCFjb2xvcikge1xuICAgICAgICByZXR1cm4gWzAsIDAsIDBdO1xuICAgIH1cblxuICAgIGlmIChjb2xvclswXSA9PT0gJyMnKSB7XG4gICAgICAgIGNvbG9yID0gY29sb3Iuc2xpY2UoMSk7XG4gICAgICAgIGlmIChjb2xvci5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgICAgIGNvbG9yID0gY29sb3JbMF0gKyBjb2xvclswXSArXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yWzFdICsgY29sb3JbMV0gK1xuICAgICAgICAgICAgICAgICAgICBjb2xvclsyXSArIGNvbG9yWzJdO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KGNvbG9yLCAxNik7XG4gICAgICAgIGNvbnN0IHIgPSAodmFsID4+IDE2KSAmIDI1NTtcbiAgICAgICAgY29uc3QgZyA9ICh2YWwgPj4gOCkgJiAyNTU7XG4gICAgICAgIGNvbnN0IGIgPSB2YWwgJiAyNTU7XG4gICAgICAgIHJldHVybiBbciwgZywgYl07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBjb2xvci5tYXRjaCgvcmdiXFwoKC4qPyksKC4qPyksKC4qPylcXCkvKTtcbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoWzFdKSxcbiAgICAgICAgICAgICAgICBwYXJzZUludChtYXRjaFsyXSksXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2hbM10pLFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gWzAsIDAsIDBdO1xufVxuXG4vLyB1dGlsaXR5IHRvIHR1cm4gW3JlZCxncmVlbixibHVlXSBpbnRvICNycmdnYmJcbmZ1bmN0aW9uIHJnYlRvQ29sb3IocmdiKSB7XG4gICAgY29uc3QgdmFsID0gKHJnYlswXSA8PCAxNikgfCAocmdiWzFdIDw8IDgpIHwgcmdiWzJdO1xuICAgIHJldHVybiAnIycgKyAoMHgxMDAwMDAwICsgdmFsKS50b1N0cmluZygxNikuc2xpY2UoMSk7XG59XG5cbmNsYXNzIFRpbnRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIC8vIFRoZSBkZWZhdWx0IGNvbG91ciBrZXlzIHRvIGJlIHJlcGxhY2VkIGFzIHJlZmVycmVkIHRvIGluIENTU1xuICAgICAgICAvLyAoc2hvdWxkIGJlIG92ZXJyaWRkZW4gYnkgLm14X3RoZW1lX2FjY2VudENvbG9yIGFuZCAubXhfdGhlbWVfc2Vjb25kYXJ5QWNjZW50Q29sb3IpXG4gICAgICAgIHRoaXMua2V5UmdiID0gW1xuICAgICAgICAgICAgXCJyZ2IoMTE4LCAyMDcsIDE2NilcIiwgLy8gVmVjdG9yIEdyZWVuXG4gICAgICAgICAgICBcInJnYigyMzQsIDI0NSwgMjQwKVwiLCAvLyBWZWN0b3IgTGlnaHQgR3JlZW5cbiAgICAgICAgICAgIFwicmdiKDIxMSwgMjM5LCAyMjUpXCIsIC8vIHJvb21zdWJsaXN0LWxhYmVsLWJnLWNvbG9yICgyMCUgR3JlZW4gb3ZlcmxhaWQgb24gTGlnaHQgR3JlZW4pXG4gICAgICAgIF07XG5cbiAgICAgICAgLy8gU29tZSBhbGdlYnJhIHdvcmtpbmdzIGZvciBjYWxjdWxhdGluZyB0aGUgdGludCAlIG9mIFZlY3RvciBHcmVlbiAmIExpZ2h0IEdyZWVuXG4gICAgICAgIC8vIHggKiAxMTggKyAoMSAtIHgpICogMjU1ID0gMjM0XG4gICAgICAgIC8vIHggKiAxMTggKyAyNTUgLSAyNTUgKiB4ID0gMjM0XG4gICAgICAgIC8vIHggKiAxMTggLSB4ICogMjU1ID0gMjM0IC0gMjU1XG4gICAgICAgIC8vICgyNTUgLSAxMTgpIHggPSAyNTUgLSAyMzRcbiAgICAgICAgLy8geCA9ICgyNTUgLSAyMzQpIC8gKDI1NSAtIDExOCkgPSAwLjE2XG5cbiAgICAgICAgLy8gVGhlIGNvbG91ciBrZXlzIHRvIGJlIHJlcGxhY2VkIGFzIHJlZmVycmVkIHRvIGluIFNWR3NcbiAgICAgICAgdGhpcy5rZXlIZXggPSBbXG4gICAgICAgICAgICBcIiM3NkNGQTZcIiwgLy8gVmVjdG9yIEdyZWVuXG4gICAgICAgICAgICBcIiNFQUY1RjBcIiwgLy8gVmVjdG9yIExpZ2h0IEdyZWVuXG4gICAgICAgICAgICBcIiNEM0VGRTFcIiwgLy8gcm9vbXN1Ymxpc3QtbGFiZWwtYmctY29sb3IgKDIwJSBHcmVlbiBvdmVybGFpZCBvbiBMaWdodCBHcmVlbilcbiAgICAgICAgICAgIFwiI0ZGRkZGRlwiLCAvLyB3aGl0ZSBoaWdobGlnaHRzIG9mIHRoZSBTVkdzIChmb3Igc3dpdGNoaW5nIHRvIGRhcmsgdGhlbWUpXG4gICAgICAgICAgICBcIiMwMDAwMDBcIiwgLy8gYmxhY2sgbG93bGlnaHRzIG9mIHRoZSBTVkdzIChmb3Igc3dpdGNoaW5nIHRvIGRhcmsgdGhlbWUpXG4gICAgICAgIF07XG5cbiAgICAgICAgLy8gdHJhY2sgdGhlIHJlcGxhY2VtZW50IGNvbG91cnMgYWN0dWFsbHkgYmVpbmcgdXNlZFxuICAgICAgICAvLyBkZWZhdWx0cyB0byBvdXIga2V5cy5cbiAgICAgICAgdGhpcy5jb2xvcnMgPSBbXG4gICAgICAgICAgICB0aGlzLmtleUhleFswXSxcbiAgICAgICAgICAgIHRoaXMua2V5SGV4WzFdLFxuICAgICAgICAgICAgdGhpcy5rZXlIZXhbMl0sXG4gICAgICAgICAgICB0aGlzLmtleUhleFszXSxcbiAgICAgICAgICAgIHRoaXMua2V5SGV4WzRdLFxuICAgICAgICBdO1xuXG4gICAgICAgIC8vIHRyYWNrIHRoZSBtb3N0IGN1cnJlbnQgdGludCByZXF1ZXN0IGlucHV0cyAod2hpY2ggbWF5IGRpZmZlciBmcm9tIHRoZVxuICAgICAgICAvLyBlbmQgcmVzdWx0IHN0b3JlZCBpbiB0aGlzLmNvbG9yc1xuICAgICAgICB0aGlzLmN1cnJlbnRUaW50ID0gW1xuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICBdO1xuXG4gICAgICAgIHRoaXMuY3NzRml4dXBzID0gW1xuICAgICAgICAgICAgLy8geyB0aGVtZToge1xuICAgICAgICAgICAgLy8gICAgICBzdHlsZTogYSBzdHlsZSBvYmplY3QgdGhhdCBzaG91bGQgYmUgZml4ZWQgdXAgdGFrZW4gZnJvbSBhIHN0eWxlc2hlZXRcbiAgICAgICAgICAgIC8vICAgICAgYXR0cjogbmFtZSBvZiB0aGUgYXR0cmlidXRlIHRvIGJlIGNsb2JiZXJlZCwgZS5nLiAnY29sb3InXG4gICAgICAgICAgICAvLyAgICAgIGluZGV4OiBvcmRpbmFsIG9mIHByaW1hcnksIHNlY29uZGFyeSBvciB0ZXJ0aWFyeVxuICAgICAgICAgICAgLy8gICB9LFxuICAgICAgICAgICAgLy8gfVxuICAgICAgICBdO1xuXG4gICAgICAgIC8vIENTUyBhdHRyaWJ1dGVzIHRvIGJlIGZpeGVkIHVwXG4gICAgICAgIHRoaXMuY3NzQXR0cnMgPSBbXG4gICAgICAgICAgICBcImNvbG9yXCIsXG4gICAgICAgICAgICBcImJhY2tncm91bmRDb2xvclwiLFxuICAgICAgICAgICAgXCJib3JkZXJDb2xvclwiLFxuICAgICAgICAgICAgXCJib3JkZXJUb3BDb2xvclwiLFxuICAgICAgICAgICAgXCJib3JkZXJCb3R0b21Db2xvclwiLFxuICAgICAgICAgICAgXCJib3JkZXJMZWZ0Q29sb3JcIixcbiAgICAgICAgXTtcblxuICAgICAgICB0aGlzLnN2Z0F0dHJzID0gW1xuICAgICAgICAgICAgXCJmaWxsXCIsXG4gICAgICAgICAgICBcInN0cm9rZVwiLFxuICAgICAgICBdO1xuXG4gICAgICAgIC8vIExpc3Qgb2YgZnVuY3Rpb25zIHRvIGNhbGwgd2hlbiB0aGUgdGludCBjaGFuZ2VzLlxuICAgICAgICB0aGlzLnRpbnRhYmxlcyA9IFtdO1xuXG4gICAgICAgIC8vIHRoZSBjdXJyZW50bHkgbG9hZGVkIHRoZW1lIChpZiBhbnkpXG4gICAgICAgIHRoaXMudGhlbWUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgLy8gd2hldGhlciB0byBmb3JjZSBhIHRpbnQgKGUuZy4gYWZ0ZXIgY2hhbmdpbmcgdGhlbWUpXG4gICAgICAgIHRoaXMuZm9yY2VUaW50ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBmaXJlIHdoZW4gdGhlIHRpbnQgY2hhbmdlcy5cbiAgICAgKiBUaGlzIGlzIHVzZWQgdG8gcmV3cml0ZSB0aGUgdGludGFibGUgU1ZHcyB3aXRoIHRoZSBuZXcgdGludC5cbiAgICAgKlxuICAgICAqIEl0J3Mgbm90IHBvc3NpYmxlIHRvIHVucmVnaXN0ZXIgYSB0aW50YWJsZSBjYWxsYmFjay4gU28gdGhpcyBjYW4gb25seSBiZVxuICAgICAqIHVzZWQgdG8gcmVnaXN0ZXIgYSBzdGF0aWMgY2FsbGJhY2suIElmIGEgc2V0IG9mIHRpbnRhYmxlcyB3aWxsIGNoYW5nZVxuICAgICAqIG92ZXIgdGltZSB0aGVuIHRoZSBiZXN0IGJldCBpcyB0byByZWdpc3RlciBhIHNpbmdsZSBjYWxsYmFjayBmb3IgdGhlXG4gICAgICogZW50aXJlIHNldC5cbiAgICAgKlxuICAgICAqIFRvIGVuc3VyZSB0aGUgdGludGFibGUgd29yayBoYXBwZW5zIGF0IGxlYXN0IG9uY2UsIGl0IGlzIGFsc28gY2FsbGVkIGFzXG4gICAgICogcGFydCBvZiByZWdpc3RyYXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSB0aW50YWJsZSBGdW5jdGlvbiB0byBjYWxsIHdoZW4gdGhlIHRpbnQgY2hhbmdlcy5cbiAgICAgKi9cbiAgICByZWdpc3RlclRpbnRhYmxlKHRpbnRhYmxlKSB7XG4gICAgICAgIHRoaXMudGludGFibGVzLnB1c2godGludGFibGUpO1xuICAgICAgICB0aW50YWJsZSgpO1xuICAgIH1cblxuICAgIGdldEtleVJnYigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMua2V5UmdiO1xuICAgIH1cblxuICAgIHRpbnQocHJpbWFyeUNvbG9yLCBzZWNvbmRhcnlDb2xvciwgdGVydGlhcnlDb2xvcikge1xuICAgICAgICByZXR1cm47XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnJlYWNoYWJsZVxuICAgICAgICB0aGlzLmN1cnJlbnRUaW50WzBdID0gcHJpbWFyeUNvbG9yO1xuICAgICAgICB0aGlzLmN1cnJlbnRUaW50WzFdID0gc2Vjb25kYXJ5Q29sb3I7XG4gICAgICAgIHRoaXMuY3VycmVudFRpbnRbMl0gPSB0ZXJ0aWFyeUNvbG9yO1xuXG4gICAgICAgIHRoaXMuY2FsY0Nzc0ZpeHVwcygpO1xuXG4gICAgICAgIGlmIChERUJVRykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaW50ZXIudGludChcIiArIHByaW1hcnlDb2xvciArIFwiLCBcIiArXG4gICAgICAgICAgICAgICAgc2Vjb25kYXJ5Q29sb3IgKyBcIiwgXCIgK1xuICAgICAgICAgICAgICAgIHRlcnRpYXJ5Q29sb3IgKyBcIilcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXByaW1hcnlDb2xvcikge1xuICAgICAgICAgICAgcHJpbWFyeUNvbG9yID0gdGhpcy5rZXlSZ2JbMF07XG4gICAgICAgICAgICBzZWNvbmRhcnlDb2xvciA9IHRoaXMua2V5UmdiWzFdO1xuICAgICAgICAgICAgdGVydGlhcnlDb2xvciA9IHRoaXMua2V5UmdiWzJdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzZWNvbmRhcnlDb2xvcikge1xuICAgICAgICAgICAgY29uc3QgeCA9IDAuMTY7IC8vIGF2ZXJhZ2Ugd2VpZ2h0aW5nIGZhY3RvciBjYWxjdWxhdGVkIGZyb20gdmVjdG9yIGdyZWVuICYgbGlnaHQgZ3JlZW5cbiAgICAgICAgICAgIGNvbnN0IHJnYiA9IGNvbG9yVG9SZ2IocHJpbWFyeUNvbG9yKTtcbiAgICAgICAgICAgIHJnYlswXSA9IHggKiByZ2JbMF0gKyAoMSAtIHgpICogMjU1O1xuICAgICAgICAgICAgcmdiWzFdID0geCAqIHJnYlsxXSArICgxIC0geCkgKiAyNTU7XG4gICAgICAgICAgICByZ2JbMl0gPSB4ICogcmdiWzJdICsgKDEgLSB4KSAqIDI1NTtcbiAgICAgICAgICAgIHNlY29uZGFyeUNvbG9yID0gcmdiVG9Db2xvcihyZ2IpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0ZXJ0aWFyeUNvbG9yKSB7XG4gICAgICAgICAgICBjb25zdCB4ID0gMC4xOTtcbiAgICAgICAgICAgIGNvbnN0IHJnYjEgPSBjb2xvclRvUmdiKHByaW1hcnlDb2xvcik7XG4gICAgICAgICAgICBjb25zdCByZ2IyID0gY29sb3JUb1JnYihzZWNvbmRhcnlDb2xvcik7XG4gICAgICAgICAgICByZ2IxWzBdID0geCAqIHJnYjFbMF0gKyAoMSAtIHgpICogcmdiMlswXTtcbiAgICAgICAgICAgIHJnYjFbMV0gPSB4ICogcmdiMVsxXSArICgxIC0geCkgKiByZ2IyWzFdO1xuICAgICAgICAgICAgcmdiMVsyXSA9IHggKiByZ2IxWzJdICsgKDEgLSB4KSAqIHJnYjJbMl07XG4gICAgICAgICAgICB0ZXJ0aWFyeUNvbG9yID0gcmdiVG9Db2xvcihyZ2IxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmZvcmNlVGludCA9PSBmYWxzZSAmJlxuICAgICAgICAgICAgdGhpcy5jb2xvcnNbMF0gPT09IHByaW1hcnlDb2xvciAmJlxuICAgICAgICAgICAgdGhpcy5jb2xvcnNbMV0gPT09IHNlY29uZGFyeUNvbG9yICYmXG4gICAgICAgICAgICB0aGlzLmNvbG9yc1syXSA9PT0gdGVydGlhcnlDb2xvcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5mb3JjZVRpbnQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmNvbG9yc1swXSA9IHByaW1hcnlDb2xvcjtcbiAgICAgICAgdGhpcy5jb2xvcnNbMV0gPSBzZWNvbmRhcnlDb2xvcjtcbiAgICAgICAgdGhpcy5jb2xvcnNbMl0gPSB0ZXJ0aWFyeUNvbG9yO1xuXG4gICAgICAgIGlmIChERUJVRykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaW50ZXIudGludCBmaW5hbDogKFwiICsgcHJpbWFyeUNvbG9yICsgXCIsIFwiICtcbiAgICAgICAgICAgICAgICBzZWNvbmRhcnlDb2xvciArIFwiLCBcIiArXG4gICAgICAgICAgICAgICAgdGVydGlhcnlDb2xvciArIFwiKVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGdvIHRocm91Z2ggbWFudWFsbHkgZml4aW5nIHVwIHRoZSBzdHlsZXNoZWV0cy5cbiAgICAgICAgdGhpcy5hcHBseUNzc0ZpeHVwcygpO1xuXG4gICAgICAgIC8vIHRlbGwgYWxsIHRoZSBTVkdzIHRvIGdvIGZpeCB0aGVtc2VsdmVzIHVwXG4gICAgICAgIC8vIHdlIGRvbid0IGRvIHRoaXMgYXMgYSBkaXNwYXRjaCBvdGhlcndpc2UgaXQgd2lsbCB2aXN1YWxseSBsYWdcbiAgICAgICAgdGhpcy50aW50YWJsZXMuZm9yRWFjaChmdW5jdGlvbih0aW50YWJsZSkge1xuICAgICAgICAgICAgdGludGFibGUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGludFN2Z1doaXRlKHdoaXRlQ29sb3IpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGludFszXSA9IHdoaXRlQ29sb3I7XG5cbiAgICAgICAgaWYgKCF3aGl0ZUNvbG9yKSB7XG4gICAgICAgICAgICB3aGl0ZUNvbG9yID0gdGhpcy5jb2xvcnNbM107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY29sb3JzWzNdID09PSB3aGl0ZUNvbG9yKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb2xvcnNbM10gPSB3aGl0ZUNvbG9yO1xuICAgICAgICB0aGlzLnRpbnRhYmxlcy5mb3JFYWNoKGZ1bmN0aW9uKHRpbnRhYmxlKSB7XG4gICAgICAgICAgICB0aW50YWJsZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB0aW50U3ZnQmxhY2soYmxhY2tDb2xvcikge1xuICAgICAgICB0aGlzLmN1cnJlbnRUaW50WzRdID0gYmxhY2tDb2xvcjtcblxuICAgICAgICBpZiAoIWJsYWNrQ29sb3IpIHtcbiAgICAgICAgICAgIGJsYWNrQ29sb3IgPSB0aGlzLmNvbG9yc1s0XTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jb2xvcnNbNF0gPT09IGJsYWNrQ29sb3IpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbG9yc1s0XSA9IGJsYWNrQ29sb3I7XG4gICAgICAgIHRoaXMudGludGFibGVzLmZvckVhY2goZnVuY3Rpb24odGludGFibGUpIHtcbiAgICAgICAgICAgIHRpbnRhYmxlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgc2V0VGhlbWUodGhlbWUpIHtcbiAgICAgICAgdGhpcy50aGVtZSA9IHRoZW1lO1xuXG4gICAgICAgIC8vIHVwZGF0ZSBrZXlSZ2IgZnJvbSB0aGUgY3VycmVudCB0aGVtZSBDU1MgaXRzZWxmLCBpZiBpdCBkZWZpbmVzIGl0XG4gICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbXhfdGhlbWVfYWNjZW50Q29sb3InKSkge1xuICAgICAgICAgICAgdGhpcy5rZXlSZ2JbMF0gPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbXhfdGhlbWVfYWNjZW50Q29sb3InKSkuY29sb3I7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdteF90aGVtZV9zZWNvbmRhcnlBY2NlbnRDb2xvcicpKSB7XG4gICAgICAgICAgICB0aGlzLmtleVJnYlsxXSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKFxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdteF90aGVtZV9zZWNvbmRhcnlBY2NlbnRDb2xvcicpKS5jb2xvcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ214X3RoZW1lX3RlcnRpYXJ5QWNjZW50Q29sb3InKSkge1xuICAgICAgICAgICAgdGhpcy5rZXlSZ2JbMl0gPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbXhfdGhlbWVfdGVydGlhcnlBY2NlbnRDb2xvcicpKS5jb2xvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FsY0Nzc0ZpeHVwcygpO1xuICAgICAgICB0aGlzLmZvcmNlVGludCA9IHRydWU7XG5cbiAgICAgICAgdGhpcy50aW50KHRoaXMuY3VycmVudFRpbnRbMF0sIHRoaXMuY3VycmVudFRpbnRbMV0sIHRoaXMuY3VycmVudFRpbnRbMl0pO1xuXG4gICAgICAgIGlmICh0aGVtZSA9PT0gJ2RhcmsnKSB7XG4gICAgICAgICAgICAvLyBhYnVzZSB0aGUgdGludGVyIHRvIGNoYW5nZSBhbGwgdGhlIFNWRydzICNmZmYgdG8gIzJkMmQyZFxuICAgICAgICAgICAgLy8gWFhYOiBvYnZpb3VzbHkgdGhpcyBzaG91bGRuJ3QgYmUgaGFyZGNvZGVkIGhlcmUuXG4gICAgICAgICAgICB0aGlzLnRpbnRTdmdXaGl0ZSgnIzJkMmQyZCcpO1xuICAgICAgICAgICAgdGhpcy50aW50U3ZnQmxhY2soJyNkZGRkZGQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudGludFN2Z1doaXRlKCcjZmZmZmZmJyk7XG4gICAgICAgICAgICB0aGlzLnRpbnRTdmdCbGFjaygnIzAwMDAwMCcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2FsY0Nzc0ZpeHVwcygpIHtcbiAgICAgICAgLy8gY2FjaGUgb3VyIGZpeHVwc1xuICAgICAgICBpZiAodGhpcy5jc3NGaXh1cHNbdGhpcy50aGVtZV0pIHJldHVybjtcblxuICAgICAgICBpZiAoREVCVUcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJjYWxjQ3NzRml4dXBzIHN0YXJ0IGZvciBcIiArIHRoaXMudGhlbWUgKyBcIiAoY2hlY2tpbmcgXCIgK1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LnN0eWxlU2hlZXRzLmxlbmd0aCArXG4gICAgICAgICAgICAgICAgXCIgc3R5bGVzaGVldHMpXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jc3NGaXh1cHNbdGhpcy50aGVtZV0gPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRvY3VtZW50LnN0eWxlU2hlZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBzcyA9IGRvY3VtZW50LnN0eWxlU2hlZXRzW2ldO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoIXNzKSBjb250aW51ZTsgLy8gd2VsbCBkb25lIHNhZmFyaSA+OihcbiAgICAgICAgICAgICAgICAvLyBDaHJvbWl1bSBhcHBhcmVudGx5IHNvbWV0aW1lcyByZXR1cm5zIG51bGwgaGVyZTsgdW5zdXJlIHdoeS5cbiAgICAgICAgICAgICAgICAvLyBzZWUgJDE0NTM0OTA3MzY5OTcyRlJYQng6bWF0cml4Lm9yZyBpbiBIUVxuICAgICAgICAgICAgICAgIC8vIC4uLmFoLCBpdCdzIGJlY2F1c2UgdGhlcmUncyBhIHRoaXJkIHBhcnR5IGV4dGVuc2lvbiBsaWtlXG4gICAgICAgICAgICAgICAgLy8gcHJpdmFjeWJhZGdlciBpbnNlcnRpbmcgaXRzIG93biBzdHlsZXNoZWV0IGluIHRoZXJlIHdpdGggYVxuICAgICAgICAgICAgICAgIC8vIHJlc291cmNlOi8vIFVSSSBvciBzb21ldGhpbmcgd2hpY2ggcmVzdWx0cyBpbiBhIFhTUyBlcnJvci5cbiAgICAgICAgICAgICAgICAvLyBTZWUgYWxzbyAjdmVjdG9yOm1hdHJpeC5vcmcvJDE0NTM1NzY2OTY4NTM4NmViQ2ZyOm1hdHJpeC5vcmdcbiAgICAgICAgICAgICAgICAvLyAuLi5leGNlcHQgc29tZSBicm93c2VycyBhcHBhcmVudGx5IHJldHVybiBzdHlsZXNoZWV0cyB3aXRob3V0XG4gICAgICAgICAgICAgICAgLy8gaHJlZnMsIHdoaWNoIHdlIGhhdmUgbm8gY2hvaWNlIGJ1dCBpZ25vcmUgcmlnaHQgbm93XG5cbiAgICAgICAgICAgICAgICAvLyBYWFggc2VyaW91c2x5PyB3ZSBhcmUgaGFyZGNvZGluZyB0aGUgbmFtZSBvZiB2ZWN0b3IncyBDU1MgZmlsZSBpblxuICAgICAgICAgICAgICAgIC8vIGhlcmU/XG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyBXaHkgZG8gd2UgbmVlZCB0byBsaW1pdCBpdCB0byB2ZWN0b3IncyBDU1MgZmlsZSBhbnl3YXkgLSBpZiB0aGVyZVxuICAgICAgICAgICAgICAgIC8vIGFyZSBvdGhlciBDU1MgZmlsZXMgYWZmZWN0aW5nIHRoZSBkb2MgZG9uJ3Qgd2Ugd2FudCB0byBhcHBseSB0aGVcbiAgICAgICAgICAgICAgICAvLyBzYW1lIHRyYW5zZm9ybWF0aW9ucyB0byB0aGVtP1xuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgLy8gSXRlcmF0aW5nIHRocm91Z2ggdGhlIENTUyBsb29raW5nIGZvciBtYXRjaGVzIHRvIGhhY2sgb24gZmVlbHNcbiAgICAgICAgICAgICAgICAvLyBwcmV0dHkgaG9ycmlibGUgYW55d2F5LiBBbmQgd2hhdCBpZiB0aGUgYXBwbGljYXRpb24gc2tpbiBkb2Vzbid0IHVzZVxuICAgICAgICAgICAgICAgIC8vIFZlY3RvciBHcmVlbiBhcyBpdHMgcHJpbWFyeSBjb2xvcj9cbiAgICAgICAgICAgICAgICAvLyAtLXJpY2h2ZGhcblxuICAgICAgICAgICAgICAgIC8vIFllcywgdGludGluZyBhc3N1bWVzIHRoYXQgeW91IGFyZSB1c2luZyB0aGUgUmlvdCBza2luIGZvciBub3cuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHJpZ2h0IHNvbHV0aW9uIHdpbGwgYmUgdG8gbW92ZSB0aGUgQ1NTIG92ZXIgdG8gcmVhY3Qtc2RrLlxuICAgICAgICAgICAgICAgIC8vIEFuZCB5ZXMsIHRoZSBkZWZhdWx0IGFzc2V0cyBmb3IgdGhlIGJhc2Ugc2tpbiBtaWdodCBhcyB3ZWxsIHVzZVxuICAgICAgICAgICAgICAgIC8vIFZlY3RvciBHcmVlbiBhcyBhbnkgb3RoZXIgY29sb3VyLlxuICAgICAgICAgICAgICAgIC8vIC0tbWF0dGhld1xuXG4gICAgICAgICAgICAgICAgLy8gc3R5bGVzaGVldHMgd2UgZG9uJ3QgaGF2ZSBwZXJtaXNzaW9uIHRvIGFjY2VzcyAoZWcuIG9uZXMgZnJvbSBleHRlbnNpb25zKSBoYXZlIGEgbnVsbFxuICAgICAgICAgICAgICAgIC8vIGhyZWYgYW5kIHdpbGwgdGhyb3cgZXhjZXB0aW9ucyBpZiB3ZSB0cnkgdG8gYWNjZXNzIHRoZWlyIHJ1bGVzLlxuICAgICAgICAgICAgICAgIGlmICghc3MuaHJlZiB8fCAhc3MuaHJlZi5tYXRjaChuZXcgUmVnRXhwKCcvdGhlbWUtJyArIHRoaXMudGhlbWUgKyAnLmNzcyQnKSkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGlmIChzcy5kaXNhYmxlZCkgY29udGludWU7XG4gICAgICAgICAgICAgICAgaWYgKCFzcy5jc3NSdWxlcykgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICBpZiAoREVCVUcpIGNvbnNvbGUuZGVidWcoXCJjYWxjQ3NzRml4dXBzIGNoZWNraW5nIFwiICsgc3MuY3NzUnVsZXMubGVuZ3RoICsgXCIgcnVsZXMgZm9yIFwiICsgc3MuaHJlZik7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHNzLmNzc1J1bGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJ1bGUgPSBzcy5jc3NSdWxlc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFydWxlLnN0eWxlKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bGUuc2VsZWN0b3JUZXh0ICYmIHJ1bGUuc2VsZWN0b3JUZXh0Lm1hdGNoKC8jbXhfdGhlbWUvKSkgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgdGhpcy5jc3NBdHRycy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXR0ciA9IHRoaXMuY3NzQXR0cnNba107XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBsID0gMDsgbCA8IHRoaXMua2V5UmdiLmxlbmd0aDsgbCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bGUuc3R5bGVbYXR0cl0gPT09IHRoaXMua2V5UmdiW2xdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3NzRml4dXBzW3RoaXMudGhlbWVdLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHJ1bGUuc3R5bGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyOiBhdHRyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBDYXRjaCBhbnkgcmFuZG9tIGV4Y2VwdGlvbnMgdGhhdCBoYXBwZW4gaGVyZTogYWxsIHNvcnRzIG9mIHRoaW5ncyBjYW4gZ29cbiAgICAgICAgICAgICAgICAvLyB3cm9uZyB3aXRoIHRoaXMgKG51bGxzLCBTZWN1cml0eUVycm9ycykgYW5kIG1vc3RseSBpdCdzIGZvciBvdGhlclxuICAgICAgICAgICAgICAgIC8vIHN0eWxlc2hlZXRzIHRoYXQgd2UgZG9uJ3Qgd2FudCB0byBwcm9jZXMgYW55d2F5LiBXZSBzaG91bGQgbm90IHByb3BhZ2F0ZSBhblxuICAgICAgICAgICAgICAgIC8vIGV4Y2VwdGlvbiBvdXQgc2luY2UgdGhpcyB3aWxsIGNhdXNlIHRoZSBhcHAgdG8gZmFpbCB0byBzdGFydC5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZhaWxlZCB0byBjYWxjdWxhdGUgQ1NTIGZpeHVwcyBmb3IgYSBzdHlsZXNoZWV0OiBcIiArIHNzLmhyZWYsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChERUJVRykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJjYWxjQ3NzRml4dXBzIGVuZCAoXCIgK1xuICAgICAgICAgICAgICAgIHRoaXMuY3NzRml4dXBzW3RoaXMudGhlbWVdLmxlbmd0aCArXG4gICAgICAgICAgICAgICAgXCIgZml4dXBzKVwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFwcGx5Q3NzRml4dXBzKCkge1xuICAgICAgICBpZiAoREVCVUcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiYXBwbHlDc3NGaXh1cHMgc3RhcnQgKFwiICtcbiAgICAgICAgICAgICAgICB0aGlzLmNzc0ZpeHVwc1t0aGlzLnRoZW1lXS5sZW5ndGggK1xuICAgICAgICAgICAgICAgIFwiIGZpeHVwcylcIik7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNzc0ZpeHVwc1t0aGlzLnRoZW1lXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY3NzRml4dXAgPSB0aGlzLmNzc0ZpeHVwc1t0aGlzLnRoZW1lXVtpXTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY3NzRml4dXAuc3R5bGVbY3NzRml4dXAuYXR0cl0gPSB0aGlzLmNvbG9yc1tjc3NGaXh1cC5pbmRleF07XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gRmlyZWZveCBRdWFudHVtIGV4cGxvZGVzIGlmIHlvdSBtYW51YWxseSBlZGl0IHRoZSBDU1MgaW4gdGhlXG4gICAgICAgICAgICAgICAgLy8gaW5zcGVjdG9yIGFuZCB0aGVuIHRyeSB0byBkbyBhIHRpbnQsIGFzIGFwcGFyZW50bHkgYWxsIHRoZVxuICAgICAgICAgICAgICAgIC8vIGZpeHVwcyBhcmUgdGhlbiBzdGFsZS5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGFwcGx5IGNzc0ZpeHVwIGluIFRpbnRlciEgXCIsIGUubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKERFQlVHKSBjb25zb2xlLmxvZyhcImFwcGx5Q3NzRml4dXBzIGVuZFwiKTtcbiAgICB9XG5cbiAgICAvLyBYWFg6IHdlIGNvdWxkIGp1c3QgbW92ZSB0aGlzIGFsbCBpbnRvIFRpbnRhYmxlU3ZnLCBidXQgYXMgaXQncyBzbyBzaW1pbGFyXG4gICAgLy8gdG8gdGhlIENTUyBmaXh1cCBzdHVmZiBpbiBUaW50ZXIgKGp1c3QgdGhhdCB0aGUgZml4dXBzIGFyZSBzdG9yZWQgaW4gVGludGFibGVTdmcpXG4gICAgLy8ga2VlcGluZyBpdCBoZXJlIGZvciBub3cuXG4gICAgY2FsY1N2Z0ZpeHVwcyhzdmdzKSB7XG4gICAgICAgIC8vIGdvIHRocm91Z2ggbWFudWFsbHkgZml4aW5nIHVwIFNWRyBjb2xvdXJzLlxuICAgICAgICAvLyB3ZSBjb3VsZCBkbyB0aGlzIGJ5IHN0eWxlc2hlZXRzLCBidXQga2VlcGluZyB0aGUgc3R5bGVzaGVldHNcbiAgICAgICAgLy8gdXBkYXRlZCB3b3VsZCBiZSBhIFBJVEEsIHNvIGp1c3QgYnJ1dGUtZm9yY2Ugc2VhcmNoIGZvciB0aGVcbiAgICAgICAgLy8ga2V5IGNvbG91cjsgY2FjaGUgdGhlIGVsZW1lbnQgYW5kIGFwcGx5LlxuXG4gICAgICAgIGlmIChERUJVRykgY29uc29sZS5sb2coXCJjYWxjU3ZnRml4dXBzIHN0YXJ0IGZvciBcIiArIHN2Z3MpO1xuICAgICAgICBjb25zdCBmaXh1cHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgc3ZnRG9jO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBzdmdEb2MgPSBzdmdzW2ldLmNvbnRlbnREb2N1bWVudDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBsZXQgbXNnID0gJ0ZhaWxlZCB0byBnZXQgc3ZnLmNvbnRlbnREb2N1bWVudCBvZiAnICsgc3Znc1tpXS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIGlmIChlLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgbXNnICs9IGUubWVzc2FnZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGUuc3RhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgbXNnICs9ICcgfCBzdGFjazogJyArIGUuc3RhY2s7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc3ZnRG9jKSBjb250aW51ZTtcbiAgICAgICAgICAgIGNvbnN0IHRhZ3MgPSBzdmdEb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCIqXCIpO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0YWdzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFnID0gdGFnc1tqXTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IHRoaXMuc3ZnQXR0cnMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXR0ciA9IHRoaXMuc3ZnQXR0cnNba107XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGwgPSAwOyBsIDwgdGhpcy5rZXlIZXgubGVuZ3RoOyBsKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWcuZ2V0QXR0cmlidXRlKGF0dHIpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnLmdldEF0dHJpYnV0ZShhdHRyKS50b1VwcGVyQ2FzZSgpID09PSB0aGlzLmtleUhleFtsXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpeHVwcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZTogdGFnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyOiBhdHRyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoREVCVUcpIGNvbnNvbGUubG9nKFwiY2FsY1N2Z0ZpeHVwcyBlbmRcIik7XG5cbiAgICAgICAgcmV0dXJuIGZpeHVwcztcbiAgICB9XG5cbiAgICBhcHBseVN2Z0ZpeHVwcyhmaXh1cHMpIHtcbiAgICAgICAgaWYgKERFQlVHKSBjb25zb2xlLmxvZyhcImFwcGx5U3ZnRml4dXBzIHN0YXJ0IGZvciBcIiArIGZpeHVwcyk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZml4dXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBzdmdGaXh1cCA9IGZpeHVwc1tpXTtcbiAgICAgICAgICAgIHN2Z0ZpeHVwLm5vZGUuc2V0QXR0cmlidXRlKHN2Z0ZpeHVwLmF0dHIsIHRoaXMuY29sb3JzW3N2Z0ZpeHVwLmluZGV4XSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKERFQlVHKSBjb25zb2xlLmxvZyhcImFwcGx5U3ZnRml4dXBzIGVuZFwiKTtcbiAgICB9XG59XG5cbmlmIChnbG9iYWwuc2luZ2xldG9uVGludGVyID09PSB1bmRlZmluZWQpIHtcbiAgICBnbG9iYWwuc2luZ2xldG9uVGludGVyID0gbmV3IFRpbnRlcigpO1xufVxuZXhwb3J0IGRlZmF1bHQgZ2xvYmFsLnNpbmdsZXRvblRpbnRlcjtcbiJdfQ==