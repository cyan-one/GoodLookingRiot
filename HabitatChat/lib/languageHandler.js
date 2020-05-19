"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.newTranslatableError = newTranslatableError;
exports._td = _td;
exports._t = _t;
exports.substitute = substitute;
exports.replaceByRegexes = replaceByRegexes;
exports.setMissingEntryGenerator = setMissingEntryGenerator;
exports.setLanguage = setLanguage;
exports.getAllLanguagesFromJson = getAllLanguagesFromJson;
exports.getLanguagesFromBrowser = getLanguagesFromBrowser;
exports.getLanguageFromBrowser = getLanguageFromBrowser;
exports.getNormalizedLanguageKeys = getNormalizedLanguageKeys;
exports.normalizeLanguageKey = normalizeLanguageKey;
exports.getCurrentLanguage = getCurrentLanguage;
exports.pickBestLanguage = pickBestLanguage;

var _browserRequest = _interopRequireDefault(require("browser-request"));

var _counterpart = _interopRequireDefault(require("counterpart"));

var _react = _interopRequireDefault(require("react"));

var _SettingsStore = _interopRequireWildcard(require("./settings/SettingsStore"));

var _PlatformPeg = _interopRequireDefault(require("./PlatformPeg"));

var _languages = _interopRequireDefault(require("$webapp/i18n/languages.json"));

/*
Copyright 2017 MTRNord and Cooperative EITA
Copyright 2017 Vector Creations Ltd.
Copyright 2019 The Matrix.org Foundation C.I.C.
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>

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
// $webapp is a webpack resolve alias pointing to the output directory, see webpack config
const i18nFolder = 'i18n/'; // Control whether to also return original, untranslated strings
// Useful for debugging and testing

const ANNOTATE_STRINGS = false; // We use english strings as keys, some of which contain full stops

_counterpart.default.setSeparator('|'); // Fall back to English


_counterpart.default.setFallbackLocale('en');
/**
 * Helper function to create an error which has an English message
 * with a translatedMessage property for use by the consumer.
 * @param {string} message Message to translate.
 * @returns {Error} The constructed error.
 */


function newTranslatableError(message) {
  const error = new Error(message);
  error.translatedMessage = _t(message);
  return error;
} // Function which only purpose is to mark that a string is translatable
// Does not actually do anything. It's helpful for automatic extraction of translatable strings


function _td(s) {
  return s;
} // Wrapper for counterpart's translation function so that it handles nulls and undefineds properly
// Takes the same arguments as counterpart.translate()


function safeCounterpartTranslate(text, options) {
  // Horrible hack to avoid https://github.com/vector-im/riot-web/issues/4191
  // The interpolation library that counterpart uses does not support undefined/null
  // values and instead will throw an error. This is a problem since everywhere else
  // in JS land passing undefined/null will simply stringify instead, and when converting
  // valid ES6 template strings to i18n strings it's extremely easy to pass undefined/null
  // if there are no existing null guards. To avoid this making the app completely inoperable,
  // we'll check all the values for undefined/null and stringify them here.
  let count;

  if (options && typeof options === 'object') {
    count = options['count'];
    Object.keys(options).forEach(k => {
      if (options[k] === undefined) {
        console.warn("safeCounterpartTranslate called with undefined interpolation name: " + k);
        options[k] = 'undefined';
      }

      if (options[k] === null) {
        console.warn("safeCounterpartTranslate called with null interpolation name: " + k);
        options[k] = 'null';
      }
    });
  }

  let translated = _counterpart.default.translate(text, options);

  if (translated === undefined && count !== undefined) {
    // counterpart does not do fallback if no pluralisation exists
    // in the preferred language, so do it here
    translated = _counterpart.default.translate(text, Object.assign({}, options, {
      locale: 'en'
    }));
  }

  return translated;
}
/*
 * Translates text and optionally also replaces XML-ish elements in the text with e.g. React components
 * @param {string} text The untranslated text, e.g "click <a>here</a> now to %(foo)s".
 * @param {object} variables Variable substitutions, e.g { foo: 'bar' }
 * @param {object} tags Tag substitutions e.g. { 'a': (sub) => <a>{sub}</a> }
 *
 * In both variables and tags, the values to substitute with can be either simple strings, React components,
 * or functions that return the value to use in the substitution (e.g. return a React component). In case of
 * a tag replacement, the function receives as the argument the text inside the element corresponding to the tag.
 *
 * Use tag substitutions if you need to translate text between tags (e.g. "<a>Click here!</a>"), otherwise
 * you will end up with literal "<a>" in your output, rather than HTML. Note that you can also use variable
 * substitution to insert React components, but you can't use it to translate text between tags.
 *
 * @return a React <span> component if any non-strings were used in substitutions, otherwise a string
 */


function _t(text, variables, tags) {
  // Don't do substitutions in counterpart. We handle it ourselves so we can replace with React components
  // However, still pass the variables to counterpart so that it can choose the correct plural if count is given
  // It is enough to pass the count variable, but in the future counterpart might make use of other information too
  const args = Object.assign({
    interpolate: false
  }, variables); // The translation returns text so there's no XSS vector here (no unsafe HTML, no code execution)

  const translated = safeCounterpartTranslate(text, args);
  const substituted = substitute(translated, variables, tags); // For development/testing purposes it is useful to also output the original string
  // Don't do that for release versions

  if (ANNOTATE_STRINGS) {
    if (typeof substituted === 'string') {
      return "@@".concat(text, "##").concat(substituted, "@@");
    } else {
      return /*#__PURE__*/_react.default.createElement("span", {
        className: "translated-string",
        "data-orig-string": text
      }, substituted);
    }
  } else {
    return substituted;
  }
}
/*
 * Similar to _t(), except only does substitutions, and no translation
 * @param {string} text The text, e.g "click <a>here</a> now to %(foo)s".
 * @param {object} variables Variable substitutions, e.g { foo: 'bar' }
 * @param {object} tags Tag substitutions e.g. { 'a': (sub) => <a>{sub}</a> }
 *
 * The values to substitute with can be either simple strings, or functions that return the value to use in
 * the substitution (e.g. return a React component). In case of a tag replacement, the function receives as
 * the argument the text inside the element corresponding to the tag.
 *
 * @return a React <span> component if any non-strings were used in substitutions, otherwise a string
 */


function substitute(text, variables, tags) {
  let result = text;

  if (variables !== undefined) {
    const regexpMapping = {};

    for (const variable in variables) {
      regexpMapping["%\\(".concat(variable, "\\)s")] = variables[variable];
    }

    result = replaceByRegexes(result, regexpMapping);
  }

  if (tags !== undefined) {
    const regexpMapping = {};

    for (const tag in tags) {
      regexpMapping["(<".concat(tag, ">(.*?)<\\/").concat(tag, ">|<").concat(tag, ">|<").concat(tag, "\\s*\\/>)")] = tags[tag];
    }

    result = replaceByRegexes(result, regexpMapping);
  }

  return result;
}
/*
 * Replace parts of a text using regular expressions
 * @param {string} text The text on which to perform substitutions
 * @param {object} mapping A mapping from regular expressions in string form to replacement string or a
 * function which will receive as the argument the capture groups defined in the regexp. E.g.
 * { 'Hello (.?) World': (sub) => sub.toUpperCase() }
 *
 * @return a React <span> component if any non-strings were used in substitutions, otherwise a string
 */


function replaceByRegexes(text, mapping) {
  // We initially store our output as an array of strings and objects (e.g. React components).
  // This will then be converted to a string or a <span> at the end
  const output = [text]; // If we insert any components we need to wrap the output in a span. React doesn't like just an array of components.

  let shouldWrapInSpan = false;

  for (const regexpString in mapping) {
    // TODO: Cache regexps
    const regexp = new RegExp(regexpString, "g"); // Loop over what output we have so far and perform replacements
    // We look for matches: if we find one, we get three parts: everything before the match, the replaced part,
    // and everything after the match. Insert all three into the output. We need to do this because we can insert objects.
    // Otherwise there would be no need for the splitting and we could do simple replacement.

    let matchFoundSomewhere = false; // If we don't find a match anywhere we want to log it

    for (const outputIndex in output) {
      const inputText = output[outputIndex];

      if (typeof inputText !== 'string') {
        // We might have inserted objects earlier, don't try to replace them
        continue;
      } // process every match in the string
      // starting with the first


      let match = regexp.exec(inputText);
      if (!match) continue;
      matchFoundSomewhere = true; // The textual part before the first match

      const head = inputText.substr(0, match.index);
      const parts = []; // keep track of prevMatch

      let prevMatch;

      while (match) {
        // store prevMatch
        prevMatch = match;
        const capturedGroups = match.slice(2);
        let replaced; // If substitution is a function, call it

        if (mapping[regexpString] instanceof Function) {
          replaced = mapping[regexpString].apply(null, capturedGroups);
        } else {
          replaced = mapping[regexpString];
        }

        if (typeof replaced === 'object') {
          shouldWrapInSpan = true;
        } // Here we also need to check that it actually is a string before comparing against one
        // The head and tail are always strings


        if (typeof replaced !== 'string' || replaced !== '') {
          parts.push(replaced);
        } // try the next match


        match = regexp.exec(inputText); // add the text between prevMatch and this one
        // or the end of the string if prevMatch is the last match

        let tail;

        if (match) {
          const startIndex = prevMatch.index + prevMatch[0].length;
          tail = inputText.substr(startIndex, match.index - startIndex);
        } else {
          tail = inputText.substr(prevMatch.index + prevMatch[0].length);
        }

        if (tail) {
          parts.push(tail);
        }
      } // Insert in reverse order as splice does insert-before and this way we get the final order correct
      // remove the old element at the same time


      output.splice(outputIndex, 1, ...parts);

      if (head !== '') {
        // Don't push empty nodes, they are of no use
        output.splice(outputIndex, 0, head);
      }
    }

    if (!matchFoundSomewhere) {
      // The current regexp did not match anything in the input
      // Missing matches is entirely possible because you might choose to show some variables only in the case
      // of e.g. plurals. It's still a bit suspicious, and could be due to an error, so log it.
      // However, not showing count is so common that it's not worth logging. And other commonly unused variables
      // here, if there are any.
      if (regexpString !== '%\\(count\\)s') {
        console.log("Could not find ".concat(regexp, " in ").concat(text));
      }
    }
  }

  if (shouldWrapInSpan) {
    return _react.default.createElement('span', null, ...output);
  } else {
    return output.join('');
  }
} // Allow overriding the text displayed when no translation exists
// Currently only used in unit tests to avoid having to load
// the translations in riot-web


function setMissingEntryGenerator(f) {
  _counterpart.default.setMissingEntryGenerator(f);
}

function setLanguage(preferredLangs) {
  if (!Array.isArray(preferredLangs)) {
    preferredLangs = [preferredLangs];
  }

  const plaf = _PlatformPeg.default.get();

  if (plaf) {
    plaf.setLanguage(preferredLangs);
  }

  let langToUse;
  let availLangs;
  return getLangsJson().then(result => {
    availLangs = result;

    for (let i = 0; i < preferredLangs.length; ++i) {
      if (availLangs.hasOwnProperty(preferredLangs[i])) {
        langToUse = preferredLangs[i];
        break;
      }
    }

    if (!langToUse) {
      // Fallback to en_EN if none is found
      langToUse = 'en';
      console.error("Unable to find an appropriate language");
    }

    return getLanguage(i18nFolder + availLangs[langToUse].fileName);
  }).then(langData => {
    _counterpart.default.registerTranslations(langToUse, langData);

    _counterpart.default.setLocale(langToUse);

    _SettingsStore.default.setValue("language", null, _SettingsStore.SettingLevel.DEVICE, langToUse);

    console.log("set language to " + langToUse); // Set 'en' as fallback language:

    if (langToUse !== "en") {
      return getLanguage(i18nFolder + availLangs['en'].fileName);
    }
  }).then(langData => {
    if (langData) _counterpart.default.registerTranslations('en', langData);
  });
}

function getAllLanguagesFromJson() {
  return getLangsJson().then(langsObject => {
    const langs = [];

    for (const langKey in langsObject) {
      if (langsObject.hasOwnProperty(langKey)) {
        langs.push({
          'value': langKey,
          'label': langsObject[langKey].label
        });
      }
    }

    return langs;
  });
}

function getLanguagesFromBrowser() {
  if (navigator.languages && navigator.languages.length) return navigator.languages;
  if (navigator.language) return [navigator.language];
  return [navigator.userLanguage || "en"];
}

function getLanguageFromBrowser() {
  return getLanguagesFromBrowser()[0];
}
/**
 * Turns a language string, normalises it,
 * (see normalizeLanguageKey) into an array of language strings
 * with fallback to generic languages
 * (eg. 'pt-BR' => ['pt-br', 'pt'])
 *
 * @param {string} language The input language string
 * @return {string[]} List of normalised languages
 */


function getNormalizedLanguageKeys(language) {
  const languageKeys = [];
  const normalizedLanguage = normalizeLanguageKey(language);
  const languageParts = normalizedLanguage.split('-');

  if (languageParts.length === 2 && languageParts[0] === languageParts[1]) {
    languageKeys.push(languageParts[0]);
  } else {
    languageKeys.push(normalizedLanguage);

    if (languageParts.length === 2) {
      languageKeys.push(languageParts[0]);
    }
  }

  return languageKeys;
}
/**
 * Returns a language string with underscores replaced with
 * hyphens, and lowercased.
 *
 * @param {string} language The language string to be normalized
 * @returns {string} The normalized language string
 */


function normalizeLanguageKey(language) {
  return language.toLowerCase().replace("_", "-");
}

function getCurrentLanguage() {
  return _counterpart.default.getLocale();
}
/**
 * Given a list of language codes, pick the most appropriate one
 * given the current language (ie. getCurrentLanguage())
 * English is assumed to be a reasonable default.
 *
 * @param {string[]} langs List of language codes to pick from
 * @returns {string} The most appropriate language code from langs
 */


function pickBestLanguage(langs) {
  const currentLang = getCurrentLanguage();
  const normalisedLangs = langs.map(normalizeLanguageKey);
  {
    // Best is an exact match
    const currentLangIndex = normalisedLangs.indexOf(currentLang);
    if (currentLangIndex > -1) return langs[currentLangIndex];
  }
  {
    // Failing that, a different dialect of the same language
    const closeLangIndex = normalisedLangs.find(l => l.substr(0, 2) === currentLang.substr(0, 2));
    if (closeLangIndex > -1) return langs[closeLangIndex];
  }
  {
    // Neither of those? Try an english variant.
    const enIndex = normalisedLangs.find(l => l.startsWith('en'));
    if (enIndex > -1) return langs[enIndex];
  } // if nothing else, use the first

  return langs[0];
}

function getLangsJson() {
  return new Promise(async (resolve, reject) => {
    let url;

    if (typeof _languages.default === 'string') {
      // in Jest this 'url' isn't a URL, so just fall through
      url = _languages.default;
    } else {
      url = i18nFolder + 'languages.json';
    }

    (0, _browserRequest.default)({
      method: "GET",
      url
    }, (err, response, body) => {
      if (err || response.status < 200 || response.status >= 300) {
        reject({
          err: err,
          response: response
        });
        return;
      }

      resolve(JSON.parse(body));
    });
  });
}

function weblateToCounterpart(inTrs) {
  const outTrs = {};

  for (const key of Object.keys(inTrs)) {
    const keyParts = key.split('|', 2);

    if (keyParts.length === 2) {
      let obj = outTrs[keyParts[0]];

      if (obj === undefined) {
        obj = {};
        outTrs[keyParts[0]] = obj;
      }

      obj[keyParts[1]] = inTrs[key];
    } else {
      outTrs[key] = inTrs[key];
    }
  }

  return outTrs;
}

function getLanguage(langPath) {
  return new Promise((resolve, reject) => {
    (0, _browserRequest.default)({
      method: "GET",
      url: langPath
    }, (err, response, body) => {
      if (err || response.status < 200 || response.status >= 300) {
        reject({
          err: err,
          response: response
        });
        return;
      }

      resolve(weblateToCounterpart(JSON.parse(body)));
    });
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9sYW5ndWFnZUhhbmRsZXIuanMiXSwibmFtZXMiOlsiaTE4bkZvbGRlciIsIkFOTk9UQVRFX1NUUklOR1MiLCJjb3VudGVycGFydCIsInNldFNlcGFyYXRvciIsInNldEZhbGxiYWNrTG9jYWxlIiwibmV3VHJhbnNsYXRhYmxlRXJyb3IiLCJtZXNzYWdlIiwiZXJyb3IiLCJFcnJvciIsInRyYW5zbGF0ZWRNZXNzYWdlIiwiX3QiLCJfdGQiLCJzIiwic2FmZUNvdW50ZXJwYXJ0VHJhbnNsYXRlIiwidGV4dCIsIm9wdGlvbnMiLCJjb3VudCIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwiayIsInVuZGVmaW5lZCIsImNvbnNvbGUiLCJ3YXJuIiwidHJhbnNsYXRlZCIsInRyYW5zbGF0ZSIsImFzc2lnbiIsImxvY2FsZSIsInZhcmlhYmxlcyIsInRhZ3MiLCJhcmdzIiwiaW50ZXJwb2xhdGUiLCJzdWJzdGl0dXRlZCIsInN1YnN0aXR1dGUiLCJyZXN1bHQiLCJyZWdleHBNYXBwaW5nIiwidmFyaWFibGUiLCJyZXBsYWNlQnlSZWdleGVzIiwidGFnIiwibWFwcGluZyIsIm91dHB1dCIsInNob3VsZFdyYXBJblNwYW4iLCJyZWdleHBTdHJpbmciLCJyZWdleHAiLCJSZWdFeHAiLCJtYXRjaEZvdW5kU29tZXdoZXJlIiwib3V0cHV0SW5kZXgiLCJpbnB1dFRleHQiLCJtYXRjaCIsImV4ZWMiLCJoZWFkIiwic3Vic3RyIiwiaW5kZXgiLCJwYXJ0cyIsInByZXZNYXRjaCIsImNhcHR1cmVkR3JvdXBzIiwic2xpY2UiLCJyZXBsYWNlZCIsIkZ1bmN0aW9uIiwiYXBwbHkiLCJwdXNoIiwidGFpbCIsInN0YXJ0SW5kZXgiLCJsZW5ndGgiLCJzcGxpY2UiLCJsb2ciLCJSZWFjdCIsImNyZWF0ZUVsZW1lbnQiLCJqb2luIiwic2V0TWlzc2luZ0VudHJ5R2VuZXJhdG9yIiwiZiIsInNldExhbmd1YWdlIiwicHJlZmVycmVkTGFuZ3MiLCJBcnJheSIsImlzQXJyYXkiLCJwbGFmIiwiUGxhdGZvcm1QZWciLCJnZXQiLCJsYW5nVG9Vc2UiLCJhdmFpbExhbmdzIiwiZ2V0TGFuZ3NKc29uIiwidGhlbiIsImkiLCJoYXNPd25Qcm9wZXJ0eSIsImdldExhbmd1YWdlIiwiZmlsZU5hbWUiLCJsYW5nRGF0YSIsInJlZ2lzdGVyVHJhbnNsYXRpb25zIiwic2V0TG9jYWxlIiwiU2V0dGluZ3NTdG9yZSIsInNldFZhbHVlIiwiU2V0dGluZ0xldmVsIiwiREVWSUNFIiwiZ2V0QWxsTGFuZ3VhZ2VzRnJvbUpzb24iLCJsYW5nc09iamVjdCIsImxhbmdzIiwibGFuZ0tleSIsImxhYmVsIiwiZ2V0TGFuZ3VhZ2VzRnJvbUJyb3dzZXIiLCJuYXZpZ2F0b3IiLCJsYW5ndWFnZXMiLCJsYW5ndWFnZSIsInVzZXJMYW5ndWFnZSIsImdldExhbmd1YWdlRnJvbUJyb3dzZXIiLCJnZXROb3JtYWxpemVkTGFuZ3VhZ2VLZXlzIiwibGFuZ3VhZ2VLZXlzIiwibm9ybWFsaXplZExhbmd1YWdlIiwibm9ybWFsaXplTGFuZ3VhZ2VLZXkiLCJsYW5ndWFnZVBhcnRzIiwic3BsaXQiLCJ0b0xvd2VyQ2FzZSIsInJlcGxhY2UiLCJnZXRDdXJyZW50TGFuZ3VhZ2UiLCJnZXRMb2NhbGUiLCJwaWNrQmVzdExhbmd1YWdlIiwiY3VycmVudExhbmciLCJub3JtYWxpc2VkTGFuZ3MiLCJtYXAiLCJjdXJyZW50TGFuZ0luZGV4IiwiaW5kZXhPZiIsImNsb3NlTGFuZ0luZGV4IiwiZmluZCIsImwiLCJlbkluZGV4Iiwic3RhcnRzV2l0aCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwidXJsIiwid2VicGFja0xhbmdKc29uVXJsIiwibWV0aG9kIiwiZXJyIiwicmVzcG9uc2UiLCJib2R5Iiwic3RhdHVzIiwiSlNPTiIsInBhcnNlIiwid2VibGF0ZVRvQ291bnRlcnBhcnQiLCJpblRycyIsIm91dFRycyIsImtleSIsImtleVBhcnRzIiwib2JqIiwibGFuZ1BhdGgiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7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RixHQUFHLElBQUlDLFFBQVEsQ0FBQ0UsTUFBVCxHQUFrQixHQUF6QixJQUFnQ0YsUUFBUSxDQUFDRSxNQUFULElBQW1CLEdBQXZELEVBQTREO0FBQ3hEUCxRQUFBQSxNQUFNLENBQUM7QUFBQ0ksVUFBQUEsR0FBRyxFQUFFQSxHQUFOO0FBQVdDLFVBQUFBLFFBQVEsRUFBRUE7QUFBckIsU0FBRCxDQUFOO0FBQ0E7QUFDSDs7QUFDRE4sTUFBQUEsT0FBTyxDQUFDVyxvQkFBb0IsQ0FBQ0YsSUFBSSxDQUFDQyxLQUFMLENBQVdILElBQVgsQ0FBRCxDQUFyQixDQUFQO0FBQ0gsS0FSTDtBQVVILEdBWE0sQ0FBUDtBQVlIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IE1UUk5vcmQgYW5kIENvb3BlcmF0aXZlIEVJVEFcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkLlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cbkNvcHlyaWdodCAyMDE5IE1pY2hhZWwgVGVsYXR5bnNraSA8N3QzY2hndXlAZ21haWwuY29tPlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCByZXF1ZXN0IGZyb20gJ2Jyb3dzZXItcmVxdWVzdCc7XG5pbXBvcnQgY291bnRlcnBhcnQgZnJvbSAnY291bnRlcnBhcnQnO1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBTZXR0aW5nc1N0b3JlLCB7U2V0dGluZ0xldmVsfSBmcm9tIFwiLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlXCI7XG5pbXBvcnQgUGxhdGZvcm1QZWcgZnJvbSBcIi4vUGxhdGZvcm1QZWdcIjtcblxuLy8gJHdlYmFwcCBpcyBhIHdlYnBhY2sgcmVzb2x2ZSBhbGlhcyBwb2ludGluZyB0byB0aGUgb3V0cHV0IGRpcmVjdG9yeSwgc2VlIHdlYnBhY2sgY29uZmlnXG5pbXBvcnQgd2VicGFja0xhbmdKc29uVXJsIGZyb20gXCIkd2ViYXBwL2kxOG4vbGFuZ3VhZ2VzLmpzb25cIjtcblxuY29uc3QgaTE4bkZvbGRlciA9ICdpMThuLyc7XG5cbi8vIENvbnRyb2wgd2hldGhlciB0byBhbHNvIHJldHVybiBvcmlnaW5hbCwgdW50cmFuc2xhdGVkIHN0cmluZ3Ncbi8vIFVzZWZ1bCBmb3IgZGVidWdnaW5nIGFuZCB0ZXN0aW5nXG5jb25zdCBBTk5PVEFURV9TVFJJTkdTID0gZmFsc2U7XG5cbi8vIFdlIHVzZSBlbmdsaXNoIHN0cmluZ3MgYXMga2V5cywgc29tZSBvZiB3aGljaCBjb250YWluIGZ1bGwgc3RvcHNcbmNvdW50ZXJwYXJ0LnNldFNlcGFyYXRvcignfCcpO1xuLy8gRmFsbCBiYWNrIHRvIEVuZ2xpc2hcbmNvdW50ZXJwYXJ0LnNldEZhbGxiYWNrTG9jYWxlKCdlbicpO1xuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBjcmVhdGUgYW4gZXJyb3Igd2hpY2ggaGFzIGFuIEVuZ2xpc2ggbWVzc2FnZVxuICogd2l0aCBhIHRyYW5zbGF0ZWRNZXNzYWdlIHByb3BlcnR5IGZvciB1c2UgYnkgdGhlIGNvbnN1bWVyLlxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgTWVzc2FnZSB0byB0cmFuc2xhdGUuXG4gKiBAcmV0dXJucyB7RXJyb3J9IFRoZSBjb25zdHJ1Y3RlZCBlcnJvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5ld1RyYW5zbGF0YWJsZUVycm9yKG1lc3NhZ2UpIHtcbiAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICBlcnJvci50cmFuc2xhdGVkTWVzc2FnZSA9IF90KG1lc3NhZ2UpO1xuICAgIHJldHVybiBlcnJvcjtcbn1cblxuLy8gRnVuY3Rpb24gd2hpY2ggb25seSBwdXJwb3NlIGlzIHRvIG1hcmsgdGhhdCBhIHN0cmluZyBpcyB0cmFuc2xhdGFibGVcbi8vIERvZXMgbm90IGFjdHVhbGx5IGRvIGFueXRoaW5nLiBJdCdzIGhlbHBmdWwgZm9yIGF1dG9tYXRpYyBleHRyYWN0aW9uIG9mIHRyYW5zbGF0YWJsZSBzdHJpbmdzXG5leHBvcnQgZnVuY3Rpb24gX3RkKHMpIHtcbiAgICByZXR1cm4gcztcbn1cblxuLy8gV3JhcHBlciBmb3IgY291bnRlcnBhcnQncyB0cmFuc2xhdGlvbiBmdW5jdGlvbiBzbyB0aGF0IGl0IGhhbmRsZXMgbnVsbHMgYW5kIHVuZGVmaW5lZHMgcHJvcGVybHlcbi8vIFRha2VzIHRoZSBzYW1lIGFyZ3VtZW50cyBhcyBjb3VudGVycGFydC50cmFuc2xhdGUoKVxuZnVuY3Rpb24gc2FmZUNvdW50ZXJwYXJ0VHJhbnNsYXRlKHRleHQsIG9wdGlvbnMpIHtcbiAgICAvLyBIb3JyaWJsZSBoYWNrIHRvIGF2b2lkIGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC13ZWIvaXNzdWVzLzQxOTFcbiAgICAvLyBUaGUgaW50ZXJwb2xhdGlvbiBsaWJyYXJ5IHRoYXQgY291bnRlcnBhcnQgdXNlcyBkb2VzIG5vdCBzdXBwb3J0IHVuZGVmaW5lZC9udWxsXG4gICAgLy8gdmFsdWVzIGFuZCBpbnN0ZWFkIHdpbGwgdGhyb3cgYW4gZXJyb3IuIFRoaXMgaXMgYSBwcm9ibGVtIHNpbmNlIGV2ZXJ5d2hlcmUgZWxzZVxuICAgIC8vIGluIEpTIGxhbmQgcGFzc2luZyB1bmRlZmluZWQvbnVsbCB3aWxsIHNpbXBseSBzdHJpbmdpZnkgaW5zdGVhZCwgYW5kIHdoZW4gY29udmVydGluZ1xuICAgIC8vIHZhbGlkIEVTNiB0ZW1wbGF0ZSBzdHJpbmdzIHRvIGkxOG4gc3RyaW5ncyBpdCdzIGV4dHJlbWVseSBlYXN5IHRvIHBhc3MgdW5kZWZpbmVkL251bGxcbiAgICAvLyBpZiB0aGVyZSBhcmUgbm8gZXhpc3RpbmcgbnVsbCBndWFyZHMuIFRvIGF2b2lkIHRoaXMgbWFraW5nIHRoZSBhcHAgY29tcGxldGVseSBpbm9wZXJhYmxlLFxuICAgIC8vIHdlJ2xsIGNoZWNrIGFsbCB0aGUgdmFsdWVzIGZvciB1bmRlZmluZWQvbnVsbCBhbmQgc3RyaW5naWZ5IHRoZW0gaGVyZS5cbiAgICBsZXQgY291bnQ7XG5cbiAgICBpZiAob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgY291bnQgPSBvcHRpb25zWydjb3VudCddO1xuICAgICAgICBPYmplY3Qua2V5cyhvcHRpb25zKS5mb3JFYWNoKChrKSA9PiB7XG4gICAgICAgICAgICBpZiAob3B0aW9uc1trXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwic2FmZUNvdW50ZXJwYXJ0VHJhbnNsYXRlIGNhbGxlZCB3aXRoIHVuZGVmaW5lZCBpbnRlcnBvbGF0aW9uIG5hbWU6IFwiICsgayk7XG4gICAgICAgICAgICAgICAgb3B0aW9uc1trXSA9ICd1bmRlZmluZWQnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wdGlvbnNba10gPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJzYWZlQ291bnRlcnBhcnRUcmFuc2xhdGUgY2FsbGVkIHdpdGggbnVsbCBpbnRlcnBvbGF0aW9uIG5hbWU6IFwiICsgayk7XG4gICAgICAgICAgICAgICAgb3B0aW9uc1trXSA9ICdudWxsJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxldCB0cmFuc2xhdGVkID0gY291bnRlcnBhcnQudHJhbnNsYXRlKHRleHQsIG9wdGlvbnMpO1xuICAgIGlmICh0cmFuc2xhdGVkID09PSB1bmRlZmluZWQgJiYgY291bnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBjb3VudGVycGFydCBkb2VzIG5vdCBkbyBmYWxsYmFjayBpZiBubyBwbHVyYWxpc2F0aW9uIGV4aXN0c1xuICAgICAgICAvLyBpbiB0aGUgcHJlZmVycmVkIGxhbmd1YWdlLCBzbyBkbyBpdCBoZXJlXG4gICAgICAgIHRyYW5zbGF0ZWQgPSBjb3VudGVycGFydC50cmFuc2xhdGUodGV4dCwgT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge2xvY2FsZTogJ2VuJ30pKTtcbiAgICB9XG4gICAgcmV0dXJuIHRyYW5zbGF0ZWQ7XG59XG5cbi8qXG4gKiBUcmFuc2xhdGVzIHRleHQgYW5kIG9wdGlvbmFsbHkgYWxzbyByZXBsYWNlcyBYTUwtaXNoIGVsZW1lbnRzIGluIHRoZSB0ZXh0IHdpdGggZS5nLiBSZWFjdCBjb21wb25lbnRzXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dCBUaGUgdW50cmFuc2xhdGVkIHRleHQsIGUuZyBcImNsaWNrIDxhPmhlcmU8L2E+IG5vdyB0byAlKGZvbylzXCIuXG4gKiBAcGFyYW0ge29iamVjdH0gdmFyaWFibGVzIFZhcmlhYmxlIHN1YnN0aXR1dGlvbnMsIGUuZyB7IGZvbzogJ2JhcicgfVxuICogQHBhcmFtIHtvYmplY3R9IHRhZ3MgVGFnIHN1YnN0aXR1dGlvbnMgZS5nLiB7ICdhJzogKHN1YikgPT4gPGE+e3N1Yn08L2E+IH1cbiAqXG4gKiBJbiBib3RoIHZhcmlhYmxlcyBhbmQgdGFncywgdGhlIHZhbHVlcyB0byBzdWJzdGl0dXRlIHdpdGggY2FuIGJlIGVpdGhlciBzaW1wbGUgc3RyaW5ncywgUmVhY3QgY29tcG9uZW50cyxcbiAqIG9yIGZ1bmN0aW9ucyB0aGF0IHJldHVybiB0aGUgdmFsdWUgdG8gdXNlIGluIHRoZSBzdWJzdGl0dXRpb24gKGUuZy4gcmV0dXJuIGEgUmVhY3QgY29tcG9uZW50KS4gSW4gY2FzZSBvZlxuICogYSB0YWcgcmVwbGFjZW1lbnQsIHRoZSBmdW5jdGlvbiByZWNlaXZlcyBhcyB0aGUgYXJndW1lbnQgdGhlIHRleHQgaW5zaWRlIHRoZSBlbGVtZW50IGNvcnJlc3BvbmRpbmcgdG8gdGhlIHRhZy5cbiAqXG4gKiBVc2UgdGFnIHN1YnN0aXR1dGlvbnMgaWYgeW91IG5lZWQgdG8gdHJhbnNsYXRlIHRleHQgYmV0d2VlbiB0YWdzIChlLmcuIFwiPGE+Q2xpY2sgaGVyZSE8L2E+XCIpLCBvdGhlcndpc2VcbiAqIHlvdSB3aWxsIGVuZCB1cCB3aXRoIGxpdGVyYWwgXCI8YT5cIiBpbiB5b3VyIG91dHB1dCwgcmF0aGVyIHRoYW4gSFRNTC4gTm90ZSB0aGF0IHlvdSBjYW4gYWxzbyB1c2UgdmFyaWFibGVcbiAqIHN1YnN0aXR1dGlvbiB0byBpbnNlcnQgUmVhY3QgY29tcG9uZW50cywgYnV0IHlvdSBjYW4ndCB1c2UgaXQgdG8gdHJhbnNsYXRlIHRleHQgYmV0d2VlbiB0YWdzLlxuICpcbiAqIEByZXR1cm4gYSBSZWFjdCA8c3Bhbj4gY29tcG9uZW50IGlmIGFueSBub24tc3RyaW5ncyB3ZXJlIHVzZWQgaW4gc3Vic3RpdHV0aW9ucywgb3RoZXJ3aXNlIGEgc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfdCh0ZXh0LCB2YXJpYWJsZXMsIHRhZ3MpIHtcbiAgICAvLyBEb24ndCBkbyBzdWJzdGl0dXRpb25zIGluIGNvdW50ZXJwYXJ0LiBXZSBoYW5kbGUgaXQgb3Vyc2VsdmVzIHNvIHdlIGNhbiByZXBsYWNlIHdpdGggUmVhY3QgY29tcG9uZW50c1xuICAgIC8vIEhvd2V2ZXIsIHN0aWxsIHBhc3MgdGhlIHZhcmlhYmxlcyB0byBjb3VudGVycGFydCBzbyB0aGF0IGl0IGNhbiBjaG9vc2UgdGhlIGNvcnJlY3QgcGx1cmFsIGlmIGNvdW50IGlzIGdpdmVuXG4gICAgLy8gSXQgaXMgZW5vdWdoIHRvIHBhc3MgdGhlIGNvdW50IHZhcmlhYmxlLCBidXQgaW4gdGhlIGZ1dHVyZSBjb3VudGVycGFydCBtaWdodCBtYWtlIHVzZSBvZiBvdGhlciBpbmZvcm1hdGlvbiB0b29cbiAgICBjb25zdCBhcmdzID0gT2JqZWN0LmFzc2lnbih7IGludGVycG9sYXRlOiBmYWxzZSB9LCB2YXJpYWJsZXMpO1xuXG4gICAgLy8gVGhlIHRyYW5zbGF0aW9uIHJldHVybnMgdGV4dCBzbyB0aGVyZSdzIG5vIFhTUyB2ZWN0b3IgaGVyZSAobm8gdW5zYWZlIEhUTUwsIG5vIGNvZGUgZXhlY3V0aW9uKVxuICAgIGNvbnN0IHRyYW5zbGF0ZWQgPSBzYWZlQ291bnRlcnBhcnRUcmFuc2xhdGUodGV4dCwgYXJncyk7XG5cbiAgICBjb25zdCBzdWJzdGl0dXRlZCA9IHN1YnN0aXR1dGUodHJhbnNsYXRlZCwgdmFyaWFibGVzLCB0YWdzKTtcblxuICAgIC8vIEZvciBkZXZlbG9wbWVudC90ZXN0aW5nIHB1cnBvc2VzIGl0IGlzIHVzZWZ1bCB0byBhbHNvIG91dHB1dCB0aGUgb3JpZ2luYWwgc3RyaW5nXG4gICAgLy8gRG9uJ3QgZG8gdGhhdCBmb3IgcmVsZWFzZSB2ZXJzaW9uc1xuICAgIGlmIChBTk5PVEFURV9TVFJJTkdTKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc3Vic3RpdHV0ZWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gYEBAJHt0ZXh0fSMjJHtzdWJzdGl0dXRlZH1AQGA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gPHNwYW4gY2xhc3NOYW1lPSd0cmFuc2xhdGVkLXN0cmluZycgZGF0YS1vcmlnLXN0cmluZz17dGV4dH0+e3N1YnN0aXR1dGVkfTwvc3Bhbj47XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gc3Vic3RpdHV0ZWQ7XG4gICAgfVxufVxuXG4vKlxuICogU2ltaWxhciB0byBfdCgpLCBleGNlcHQgb25seSBkb2VzIHN1YnN0aXR1dGlvbnMsIGFuZCBubyB0cmFuc2xhdGlvblxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgVGhlIHRleHQsIGUuZyBcImNsaWNrIDxhPmhlcmU8L2E+IG5vdyB0byAlKGZvbylzXCIuXG4gKiBAcGFyYW0ge29iamVjdH0gdmFyaWFibGVzIFZhcmlhYmxlIHN1YnN0aXR1dGlvbnMsIGUuZyB7IGZvbzogJ2JhcicgfVxuICogQHBhcmFtIHtvYmplY3R9IHRhZ3MgVGFnIHN1YnN0aXR1dGlvbnMgZS5nLiB7ICdhJzogKHN1YikgPT4gPGE+e3N1Yn08L2E+IH1cbiAqXG4gKiBUaGUgdmFsdWVzIHRvIHN1YnN0aXR1dGUgd2l0aCBjYW4gYmUgZWl0aGVyIHNpbXBsZSBzdHJpbmdzLCBvciBmdW5jdGlvbnMgdGhhdCByZXR1cm4gdGhlIHZhbHVlIHRvIHVzZSBpblxuICogdGhlIHN1YnN0aXR1dGlvbiAoZS5nLiByZXR1cm4gYSBSZWFjdCBjb21wb25lbnQpLiBJbiBjYXNlIG9mIGEgdGFnIHJlcGxhY2VtZW50LCB0aGUgZnVuY3Rpb24gcmVjZWl2ZXMgYXNcbiAqIHRoZSBhcmd1bWVudCB0aGUgdGV4dCBpbnNpZGUgdGhlIGVsZW1lbnQgY29ycmVzcG9uZGluZyB0byB0aGUgdGFnLlxuICpcbiAqIEByZXR1cm4gYSBSZWFjdCA8c3Bhbj4gY29tcG9uZW50IGlmIGFueSBub24tc3RyaW5ncyB3ZXJlIHVzZWQgaW4gc3Vic3RpdHV0aW9ucywgb3RoZXJ3aXNlIGEgc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdWJzdGl0dXRlKHRleHQsIHZhcmlhYmxlcywgdGFncykge1xuICAgIGxldCByZXN1bHQgPSB0ZXh0O1xuXG4gICAgaWYgKHZhcmlhYmxlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnN0IHJlZ2V4cE1hcHBpbmcgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCB2YXJpYWJsZSBpbiB2YXJpYWJsZXMpIHtcbiAgICAgICAgICAgIHJlZ2V4cE1hcHBpbmdbYCVcXFxcKCR7dmFyaWFibGV9XFxcXClzYF0gPSB2YXJpYWJsZXNbdmFyaWFibGVdO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCA9IHJlcGxhY2VCeVJlZ2V4ZXMocmVzdWx0LCByZWdleHBNYXBwaW5nKTtcbiAgICB9XG5cbiAgICBpZiAodGFncyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnN0IHJlZ2V4cE1hcHBpbmcgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCB0YWcgaW4gdGFncykge1xuICAgICAgICAgICAgcmVnZXhwTWFwcGluZ1tgKDwke3RhZ30+KC4qPyk8XFxcXC8ke3RhZ30+fDwke3RhZ30+fDwke3RhZ31cXFxccypcXFxcLz4pYF0gPSB0YWdzW3RhZ107XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gcmVwbGFjZUJ5UmVnZXhlcyhyZXN1bHQsIHJlZ2V4cE1hcHBpbmcpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qXG4gKiBSZXBsYWNlIHBhcnRzIG9mIGEgdGV4dCB1c2luZyByZWd1bGFyIGV4cHJlc3Npb25zXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dCBUaGUgdGV4dCBvbiB3aGljaCB0byBwZXJmb3JtIHN1YnN0aXR1dGlvbnNcbiAqIEBwYXJhbSB7b2JqZWN0fSBtYXBwaW5nIEEgbWFwcGluZyBmcm9tIHJlZ3VsYXIgZXhwcmVzc2lvbnMgaW4gc3RyaW5nIGZvcm0gdG8gcmVwbGFjZW1lbnQgc3RyaW5nIG9yIGFcbiAqIGZ1bmN0aW9uIHdoaWNoIHdpbGwgcmVjZWl2ZSBhcyB0aGUgYXJndW1lbnQgdGhlIGNhcHR1cmUgZ3JvdXBzIGRlZmluZWQgaW4gdGhlIHJlZ2V4cC4gRS5nLlxuICogeyAnSGVsbG8gKC4/KSBXb3JsZCc6IChzdWIpID0+IHN1Yi50b1VwcGVyQ2FzZSgpIH1cbiAqXG4gKiBAcmV0dXJuIGEgUmVhY3QgPHNwYW4+IGNvbXBvbmVudCBpZiBhbnkgbm9uLXN0cmluZ3Mgd2VyZSB1c2VkIGluIHN1YnN0aXR1dGlvbnMsIG90aGVyd2lzZSBhIHN0cmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVwbGFjZUJ5UmVnZXhlcyh0ZXh0LCBtYXBwaW5nKSB7XG4gICAgLy8gV2UgaW5pdGlhbGx5IHN0b3JlIG91ciBvdXRwdXQgYXMgYW4gYXJyYXkgb2Ygc3RyaW5ncyBhbmQgb2JqZWN0cyAoZS5nLiBSZWFjdCBjb21wb25lbnRzKS5cbiAgICAvLyBUaGlzIHdpbGwgdGhlbiBiZSBjb252ZXJ0ZWQgdG8gYSBzdHJpbmcgb3IgYSA8c3Bhbj4gYXQgdGhlIGVuZFxuICAgIGNvbnN0IG91dHB1dCA9IFt0ZXh0XTtcblxuICAgIC8vIElmIHdlIGluc2VydCBhbnkgY29tcG9uZW50cyB3ZSBuZWVkIHRvIHdyYXAgdGhlIG91dHB1dCBpbiBhIHNwYW4uIFJlYWN0IGRvZXNuJ3QgbGlrZSBqdXN0IGFuIGFycmF5IG9mIGNvbXBvbmVudHMuXG4gICAgbGV0IHNob3VsZFdyYXBJblNwYW4gPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgcmVnZXhwU3RyaW5nIGluIG1hcHBpbmcpIHtcbiAgICAgICAgLy8gVE9ETzogQ2FjaGUgcmVnZXhwc1xuICAgICAgICBjb25zdCByZWdleHAgPSBuZXcgUmVnRXhwKHJlZ2V4cFN0cmluZywgXCJnXCIpO1xuXG4gICAgICAgIC8vIExvb3Agb3ZlciB3aGF0IG91dHB1dCB3ZSBoYXZlIHNvIGZhciBhbmQgcGVyZm9ybSByZXBsYWNlbWVudHNcbiAgICAgICAgLy8gV2UgbG9vayBmb3IgbWF0Y2hlczogaWYgd2UgZmluZCBvbmUsIHdlIGdldCB0aHJlZSBwYXJ0czogZXZlcnl0aGluZyBiZWZvcmUgdGhlIG1hdGNoLCB0aGUgcmVwbGFjZWQgcGFydCxcbiAgICAgICAgLy8gYW5kIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIG1hdGNoLiBJbnNlcnQgYWxsIHRocmVlIGludG8gdGhlIG91dHB1dC4gV2UgbmVlZCB0byBkbyB0aGlzIGJlY2F1c2Ugd2UgY2FuIGluc2VydCBvYmplY3RzLlxuICAgICAgICAvLyBPdGhlcndpc2UgdGhlcmUgd291bGQgYmUgbm8gbmVlZCBmb3IgdGhlIHNwbGl0dGluZyBhbmQgd2UgY291bGQgZG8gc2ltcGxlIHJlcGxhY2VtZW50LlxuICAgICAgICBsZXQgbWF0Y2hGb3VuZFNvbWV3aGVyZSA9IGZhbHNlOyAvLyBJZiB3ZSBkb24ndCBmaW5kIGEgbWF0Y2ggYW55d2hlcmUgd2Ugd2FudCB0byBsb2cgaXRcbiAgICAgICAgZm9yIChjb25zdCBvdXRwdXRJbmRleCBpbiBvdXRwdXQpIHtcbiAgICAgICAgICAgIGNvbnN0IGlucHV0VGV4dCA9IG91dHB1dFtvdXRwdXRJbmRleF07XG4gICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0VGV4dCAhPT0gJ3N0cmluZycpIHsgLy8gV2UgbWlnaHQgaGF2ZSBpbnNlcnRlZCBvYmplY3RzIGVhcmxpZXIsIGRvbid0IHRyeSB0byByZXBsYWNlIHRoZW1cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcHJvY2VzcyBldmVyeSBtYXRjaCBpbiB0aGUgc3RyaW5nXG4gICAgICAgICAgICAvLyBzdGFydGluZyB3aXRoIHRoZSBmaXJzdFxuICAgICAgICAgICAgbGV0IG1hdGNoID0gcmVnZXhwLmV4ZWMoaW5wdXRUZXh0KTtcblxuICAgICAgICAgICAgaWYgKCFtYXRjaCkgY29udGludWU7XG4gICAgICAgICAgICBtYXRjaEZvdW5kU29tZXdoZXJlID0gdHJ1ZTtcblxuICAgICAgICAgICAgLy8gVGhlIHRleHR1YWwgcGFydCBiZWZvcmUgdGhlIGZpcnN0IG1hdGNoXG4gICAgICAgICAgICBjb25zdCBoZWFkID0gaW5wdXRUZXh0LnN1YnN0cigwLCBtYXRjaC5pbmRleCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gW107XG4gICAgICAgICAgICAvLyBrZWVwIHRyYWNrIG9mIHByZXZNYXRjaFxuICAgICAgICAgICAgbGV0IHByZXZNYXRjaDtcbiAgICAgICAgICAgIHdoaWxlIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIC8vIHN0b3JlIHByZXZNYXRjaFxuICAgICAgICAgICAgICAgIHByZXZNYXRjaCA9IG1hdGNoO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhcHR1cmVkR3JvdXBzID0gbWF0Y2guc2xpY2UoMik7XG5cbiAgICAgICAgICAgICAgICBsZXQgcmVwbGFjZWQ7XG4gICAgICAgICAgICAgICAgLy8gSWYgc3Vic3RpdHV0aW9uIGlzIGEgZnVuY3Rpb24sIGNhbGwgaXRcbiAgICAgICAgICAgICAgICBpZiAobWFwcGluZ1tyZWdleHBTdHJpbmddIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwbGFjZWQgPSBtYXBwaW5nW3JlZ2V4cFN0cmluZ10uYXBwbHkobnVsbCwgY2FwdHVyZWRHcm91cHMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcGxhY2VkID0gbWFwcGluZ1tyZWdleHBTdHJpbmddO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVwbGFjZWQgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIHNob3VsZFdyYXBJblNwYW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEhlcmUgd2UgYWxzbyBuZWVkIHRvIGNoZWNrIHRoYXQgaXQgYWN0dWFsbHkgaXMgYSBzdHJpbmcgYmVmb3JlIGNvbXBhcmluZyBhZ2FpbnN0IG9uZVxuICAgICAgICAgICAgICAgIC8vIFRoZSBoZWFkIGFuZCB0YWlsIGFyZSBhbHdheXMgc3RyaW5nc1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVwbGFjZWQgIT09ICdzdHJpbmcnIHx8IHJlcGxhY2VkICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICBwYXJ0cy5wdXNoKHJlcGxhY2VkKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyB0cnkgdGhlIG5leHQgbWF0Y2hcbiAgICAgICAgICAgICAgICBtYXRjaCA9IHJlZ2V4cC5leGVjKGlucHV0VGV4dCk7XG5cbiAgICAgICAgICAgICAgICAvLyBhZGQgdGhlIHRleHQgYmV0d2VlbiBwcmV2TWF0Y2ggYW5kIHRoaXMgb25lXG4gICAgICAgICAgICAgICAgLy8gb3IgdGhlIGVuZCBvZiB0aGUgc3RyaW5nIGlmIHByZXZNYXRjaCBpcyB0aGUgbGFzdCBtYXRjaFxuICAgICAgICAgICAgICAgIGxldCB0YWlsO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGFydEluZGV4ID0gcHJldk1hdGNoLmluZGV4ICsgcHJldk1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgdGFpbCA9IGlucHV0VGV4dC5zdWJzdHIoc3RhcnRJbmRleCwgbWF0Y2guaW5kZXggLSBzdGFydEluZGV4KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0YWlsID0gaW5wdXRUZXh0LnN1YnN0cihwcmV2TWF0Y2guaW5kZXggKyBwcmV2TWF0Y2hbMF0ubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRhaWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFydHMucHVzaCh0YWlsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEluc2VydCBpbiByZXZlcnNlIG9yZGVyIGFzIHNwbGljZSBkb2VzIGluc2VydC1iZWZvcmUgYW5kIHRoaXMgd2F5IHdlIGdldCB0aGUgZmluYWwgb3JkZXIgY29ycmVjdFxuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBvbGQgZWxlbWVudCBhdCB0aGUgc2FtZSB0aW1lXG4gICAgICAgICAgICBvdXRwdXQuc3BsaWNlKG91dHB1dEluZGV4LCAxLCAuLi5wYXJ0cyk7XG5cbiAgICAgICAgICAgIGlmIChoZWFkICE9PSAnJykgeyAvLyBEb24ndCBwdXNoIGVtcHR5IG5vZGVzLCB0aGV5IGFyZSBvZiBubyB1c2VcbiAgICAgICAgICAgICAgICBvdXRwdXQuc3BsaWNlKG91dHB1dEluZGV4LCAwLCBoZWFkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIW1hdGNoRm91bmRTb21ld2hlcmUpIHsgLy8gVGhlIGN1cnJlbnQgcmVnZXhwIGRpZCBub3QgbWF0Y2ggYW55dGhpbmcgaW4gdGhlIGlucHV0XG4gICAgICAgICAgICAvLyBNaXNzaW5nIG1hdGNoZXMgaXMgZW50aXJlbHkgcG9zc2libGUgYmVjYXVzZSB5b3UgbWlnaHQgY2hvb3NlIHRvIHNob3cgc29tZSB2YXJpYWJsZXMgb25seSBpbiB0aGUgY2FzZVxuICAgICAgICAgICAgLy8gb2YgZS5nLiBwbHVyYWxzLiBJdCdzIHN0aWxsIGEgYml0IHN1c3BpY2lvdXMsIGFuZCBjb3VsZCBiZSBkdWUgdG8gYW4gZXJyb3IsIHNvIGxvZyBpdC5cbiAgICAgICAgICAgIC8vIEhvd2V2ZXIsIG5vdCBzaG93aW5nIGNvdW50IGlzIHNvIGNvbW1vbiB0aGF0IGl0J3Mgbm90IHdvcnRoIGxvZ2dpbmcuIEFuZCBvdGhlciBjb21tb25seSB1bnVzZWQgdmFyaWFibGVzXG4gICAgICAgICAgICAvLyBoZXJlLCBpZiB0aGVyZSBhcmUgYW55LlxuICAgICAgICAgICAgaWYgKHJlZ2V4cFN0cmluZyAhPT0gJyVcXFxcKGNvdW50XFxcXClzJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDb3VsZCBub3QgZmluZCAke3JlZ2V4cH0gaW4gJHt0ZXh0fWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHNob3VsZFdyYXBJblNwYW4pIHtcbiAgICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nLCBudWxsLCAuLi5vdXRwdXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBvdXRwdXQuam9pbignJyk7XG4gICAgfVxufVxuXG4vLyBBbGxvdyBvdmVycmlkaW5nIHRoZSB0ZXh0IGRpc3BsYXllZCB3aGVuIG5vIHRyYW5zbGF0aW9uIGV4aXN0c1xuLy8gQ3VycmVudGx5IG9ubHkgdXNlZCBpbiB1bml0IHRlc3RzIHRvIGF2b2lkIGhhdmluZyB0byBsb2FkXG4vLyB0aGUgdHJhbnNsYXRpb25zIGluIHJpb3Qtd2ViXG5leHBvcnQgZnVuY3Rpb24gc2V0TWlzc2luZ0VudHJ5R2VuZXJhdG9yKGYpIHtcbiAgICBjb3VudGVycGFydC5zZXRNaXNzaW5nRW50cnlHZW5lcmF0b3IoZik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRMYW5ndWFnZShwcmVmZXJyZWRMYW5ncykge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShwcmVmZXJyZWRMYW5ncykpIHtcbiAgICAgICAgcHJlZmVycmVkTGFuZ3MgPSBbcHJlZmVycmVkTGFuZ3NdO1xuICAgIH1cblxuICAgIGNvbnN0IHBsYWYgPSBQbGF0Zm9ybVBlZy5nZXQoKTtcbiAgICBpZiAocGxhZikge1xuICAgICAgICBwbGFmLnNldExhbmd1YWdlKHByZWZlcnJlZExhbmdzKTtcbiAgICB9XG5cbiAgICBsZXQgbGFuZ1RvVXNlO1xuICAgIGxldCBhdmFpbExhbmdzO1xuICAgIHJldHVybiBnZXRMYW5nc0pzb24oKS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgYXZhaWxMYW5ncyA9IHJlc3VsdDtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZlcnJlZExhbmdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAoYXZhaWxMYW5ncy5oYXNPd25Qcm9wZXJ0eShwcmVmZXJyZWRMYW5nc1tpXSkpIHtcbiAgICAgICAgICAgICAgICBsYW5nVG9Vc2UgPSBwcmVmZXJyZWRMYW5nc1tpXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWxhbmdUb1VzZSkge1xuICAgICAgICAgICAgLy8gRmFsbGJhY2sgdG8gZW5fRU4gaWYgbm9uZSBpcyBmb3VuZFxuICAgICAgICAgICAgbGFuZ1RvVXNlID0gJ2VuJztcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmFibGUgdG8gZmluZCBhbiBhcHByb3ByaWF0ZSBsYW5ndWFnZVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnZXRMYW5ndWFnZShpMThuRm9sZGVyICsgYXZhaWxMYW5nc1tsYW5nVG9Vc2VdLmZpbGVOYW1lKTtcbiAgICB9KS50aGVuKChsYW5nRGF0YSkgPT4ge1xuICAgICAgICBjb3VudGVycGFydC5yZWdpc3RlclRyYW5zbGF0aW9ucyhsYW5nVG9Vc2UsIGxhbmdEYXRhKTtcbiAgICAgICAgY291bnRlcnBhcnQuc2V0TG9jYWxlKGxhbmdUb1VzZSk7XG4gICAgICAgIFNldHRpbmdzU3RvcmUuc2V0VmFsdWUoXCJsYW5ndWFnZVwiLCBudWxsLCBTZXR0aW5nTGV2ZWwuREVWSUNFLCBsYW5nVG9Vc2UpO1xuICAgICAgICBjb25zb2xlLmxvZyhcInNldCBsYW5ndWFnZSB0byBcIiArIGxhbmdUb1VzZSk7XG5cbiAgICAgICAgLy8gU2V0ICdlbicgYXMgZmFsbGJhY2sgbGFuZ3VhZ2U6XG4gICAgICAgIGlmIChsYW5nVG9Vc2UgIT09IFwiZW5cIikge1xuICAgICAgICAgICAgcmV0dXJuIGdldExhbmd1YWdlKGkxOG5Gb2xkZXIgKyBhdmFpbExhbmdzWydlbiddLmZpbGVOYW1lKTtcbiAgICAgICAgfVxuICAgIH0pLnRoZW4oKGxhbmdEYXRhKSA9PiB7XG4gICAgICAgIGlmIChsYW5nRGF0YSkgY291bnRlcnBhcnQucmVnaXN0ZXJUcmFuc2xhdGlvbnMoJ2VuJywgbGFuZ0RhdGEpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsTGFuZ3VhZ2VzRnJvbUpzb24oKSB7XG4gICAgcmV0dXJuIGdldExhbmdzSnNvbigpLnRoZW4oKGxhbmdzT2JqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IGxhbmdzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgbGFuZ0tleSBpbiBsYW5nc09iamVjdCkge1xuICAgICAgICAgICAgaWYgKGxhbmdzT2JqZWN0Lmhhc093blByb3BlcnR5KGxhbmdLZXkpKSB7XG4gICAgICAgICAgICAgICAgbGFuZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICd2YWx1ZSc6IGxhbmdLZXksXG4gICAgICAgICAgICAgICAgICAgICdsYWJlbCc6IGxhbmdzT2JqZWN0W2xhbmdLZXldLmxhYmVsLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsYW5ncztcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExhbmd1YWdlc0Zyb21Ccm93c2VyKCkge1xuICAgIGlmIChuYXZpZ2F0b3IubGFuZ3VhZ2VzICYmIG5hdmlnYXRvci5sYW5ndWFnZXMubGVuZ3RoKSByZXR1cm4gbmF2aWdhdG9yLmxhbmd1YWdlcztcbiAgICBpZiAobmF2aWdhdG9yLmxhbmd1YWdlKSByZXR1cm4gW25hdmlnYXRvci5sYW5ndWFnZV07XG4gICAgcmV0dXJuIFtuYXZpZ2F0b3IudXNlckxhbmd1YWdlIHx8IFwiZW5cIl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYW5ndWFnZUZyb21Ccm93c2VyKCkge1xuICAgIHJldHVybiBnZXRMYW5ndWFnZXNGcm9tQnJvd3NlcigpWzBdO1xufVxuXG4vKipcbiAqIFR1cm5zIGEgbGFuZ3VhZ2Ugc3RyaW5nLCBub3JtYWxpc2VzIGl0LFxuICogKHNlZSBub3JtYWxpemVMYW5ndWFnZUtleSkgaW50byBhbiBhcnJheSBvZiBsYW5ndWFnZSBzdHJpbmdzXG4gKiB3aXRoIGZhbGxiYWNrIHRvIGdlbmVyaWMgbGFuZ3VhZ2VzXG4gKiAoZWcuICdwdC1CUicgPT4gWydwdC1icicsICdwdCddKVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZSBUaGUgaW5wdXQgbGFuZ3VhZ2Ugc3RyaW5nXG4gKiBAcmV0dXJuIHtzdHJpbmdbXX0gTGlzdCBvZiBub3JtYWxpc2VkIGxhbmd1YWdlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9ybWFsaXplZExhbmd1YWdlS2V5cyhsYW5ndWFnZSkge1xuICAgIGNvbnN0IGxhbmd1YWdlS2V5cyA9IFtdO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRMYW5ndWFnZSA9IG5vcm1hbGl6ZUxhbmd1YWdlS2V5KGxhbmd1YWdlKTtcbiAgICBjb25zdCBsYW5ndWFnZVBhcnRzID0gbm9ybWFsaXplZExhbmd1YWdlLnNwbGl0KCctJyk7XG4gICAgaWYgKGxhbmd1YWdlUGFydHMubGVuZ3RoID09PSAyICYmIGxhbmd1YWdlUGFydHNbMF0gPT09IGxhbmd1YWdlUGFydHNbMV0pIHtcbiAgICAgICAgbGFuZ3VhZ2VLZXlzLnB1c2gobGFuZ3VhZ2VQYXJ0c1swXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbGFuZ3VhZ2VLZXlzLnB1c2gobm9ybWFsaXplZExhbmd1YWdlKTtcbiAgICAgICAgaWYgKGxhbmd1YWdlUGFydHMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICBsYW5ndWFnZUtleXMucHVzaChsYW5ndWFnZVBhcnRzWzBdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbGFuZ3VhZ2VLZXlzO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBsYW5ndWFnZSBzdHJpbmcgd2l0aCB1bmRlcnNjb3JlcyByZXBsYWNlZCB3aXRoXG4gKiBoeXBoZW5zLCBhbmQgbG93ZXJjYXNlZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2UgVGhlIGxhbmd1YWdlIHN0cmluZyB0byBiZSBub3JtYWxpemVkXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgbm9ybWFsaXplZCBsYW5ndWFnZSBzdHJpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUxhbmd1YWdlS2V5KGxhbmd1YWdlKSB7XG4gICAgcmV0dXJuIGxhbmd1YWdlLnRvTG93ZXJDYXNlKCkucmVwbGFjZShcIl9cIiwgXCItXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudExhbmd1YWdlKCkge1xuICAgIHJldHVybiBjb3VudGVycGFydC5nZXRMb2NhbGUoKTtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIGxpc3Qgb2YgbGFuZ3VhZ2UgY29kZXMsIHBpY2sgdGhlIG1vc3QgYXBwcm9wcmlhdGUgb25lXG4gKiBnaXZlbiB0aGUgY3VycmVudCBsYW5ndWFnZSAoaWUuIGdldEN1cnJlbnRMYW5ndWFnZSgpKVxuICogRW5nbGlzaCBpcyBhc3N1bWVkIHRvIGJlIGEgcmVhc29uYWJsZSBkZWZhdWx0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nW119IGxhbmdzIExpc3Qgb2YgbGFuZ3VhZ2UgY29kZXMgdG8gcGljayBmcm9tXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgbW9zdCBhcHByb3ByaWF0ZSBsYW5ndWFnZSBjb2RlIGZyb20gbGFuZ3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBpY2tCZXN0TGFuZ3VhZ2UobGFuZ3MpIHtcbiAgICBjb25zdCBjdXJyZW50TGFuZyA9IGdldEN1cnJlbnRMYW5ndWFnZSgpO1xuICAgIGNvbnN0IG5vcm1hbGlzZWRMYW5ncyA9IGxhbmdzLm1hcChub3JtYWxpemVMYW5ndWFnZUtleSk7XG5cbiAgICB7XG4gICAgICAgIC8vIEJlc3QgaXMgYW4gZXhhY3QgbWF0Y2hcbiAgICAgICAgY29uc3QgY3VycmVudExhbmdJbmRleCA9IG5vcm1hbGlzZWRMYW5ncy5pbmRleE9mKGN1cnJlbnRMYW5nKTtcbiAgICAgICAgaWYgKGN1cnJlbnRMYW5nSW5kZXggPiAtMSkgcmV0dXJuIGxhbmdzW2N1cnJlbnRMYW5nSW5kZXhdO1xuICAgIH1cblxuICAgIHtcbiAgICAgICAgLy8gRmFpbGluZyB0aGF0LCBhIGRpZmZlcmVudCBkaWFsZWN0IG9mIHRoZSBzYW1lIGxhbmd1YWdlXG4gICAgICAgIGNvbnN0IGNsb3NlTGFuZ0luZGV4ID0gbm9ybWFsaXNlZExhbmdzLmZpbmQoKGwpID0+IGwuc3Vic3RyKDAsIDIpID09PSBjdXJyZW50TGFuZy5zdWJzdHIoMCwgMikpO1xuICAgICAgICBpZiAoY2xvc2VMYW5nSW5kZXggPiAtMSkgcmV0dXJuIGxhbmdzW2Nsb3NlTGFuZ0luZGV4XTtcbiAgICB9XG5cbiAgICB7XG4gICAgICAgIC8vIE5laXRoZXIgb2YgdGhvc2U/IFRyeSBhbiBlbmdsaXNoIHZhcmlhbnQuXG4gICAgICAgIGNvbnN0IGVuSW5kZXggPSBub3JtYWxpc2VkTGFuZ3MuZmluZCgobCkgPT4gbC5zdGFydHNXaXRoKCdlbicpKTtcbiAgICAgICAgaWYgKGVuSW5kZXggPiAtMSkgcmV0dXJuIGxhbmdzW2VuSW5kZXhdO1xuICAgIH1cblxuICAgIC8vIGlmIG5vdGhpbmcgZWxzZSwgdXNlIHRoZSBmaXJzdFxuICAgIHJldHVybiBsYW5nc1swXTtcbn1cblxuZnVuY3Rpb24gZ2V0TGFuZ3NKc29uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGxldCB1cmw7XG4gICAgICAgIGlmICh0eXBlb2Yod2VicGFja0xhbmdKc29uVXJsKSA9PT0gJ3N0cmluZycpIHsgLy8gaW4gSmVzdCB0aGlzICd1cmwnIGlzbid0IGEgVVJMLCBzbyBqdXN0IGZhbGwgdGhyb3VnaFxuICAgICAgICAgICAgdXJsID0gd2VicGFja0xhbmdKc29uVXJsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXJsID0gaTE4bkZvbGRlciArICdsYW5ndWFnZXMuanNvbic7XG4gICAgICAgIH1cbiAgICAgICAgcmVxdWVzdChcbiAgICAgICAgICAgIHsgbWV0aG9kOiBcIkdFVFwiLCB1cmwgfSxcbiAgICAgICAgICAgIChlcnIsIHJlc3BvbnNlLCBib2R5KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVyciB8fCByZXNwb25zZS5zdGF0dXMgPCAyMDAgfHwgcmVzcG9uc2Uuc3RhdHVzID49IDMwMCkge1xuICAgICAgICAgICAgICAgICAgICByZWplY3Qoe2VycjogZXJyLCByZXNwb25zZTogcmVzcG9uc2V9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNvbHZlKEpTT04ucGFyc2UoYm9keSkpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gd2VibGF0ZVRvQ291bnRlcnBhcnQoaW5UcnMpIHtcbiAgICBjb25zdCBvdXRUcnMgPSB7fTtcblxuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGluVHJzKSkge1xuICAgICAgICBjb25zdCBrZXlQYXJ0cyA9IGtleS5zcGxpdCgnfCcsIDIpO1xuICAgICAgICBpZiAoa2V5UGFydHMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICBsZXQgb2JqID0gb3V0VHJzW2tleVBhcnRzWzBdXTtcbiAgICAgICAgICAgIGlmIChvYmogPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIG9iaiA9IHt9O1xuICAgICAgICAgICAgICAgIG91dFRyc1trZXlQYXJ0c1swXV0gPSBvYmo7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvYmpba2V5UGFydHNbMV1dID0gaW5UcnNba2V5XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dFRyc1trZXldID0gaW5UcnNba2V5XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvdXRUcnM7XG59XG5cbmZ1bmN0aW9uIGdldExhbmd1YWdlKGxhbmdQYXRoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgcmVxdWVzdChcbiAgICAgICAgICAgIHsgbWV0aG9kOiBcIkdFVFwiLCB1cmw6IGxhbmdQYXRoIH0sXG4gICAgICAgICAgICAoZXJyLCByZXNwb25zZSwgYm9keSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIgfHwgcmVzcG9uc2Uuc3RhdHVzIDwgMjAwIHx8IHJlc3BvbnNlLnN0YXR1cyA+PSAzMDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHtlcnI6IGVyciwgcmVzcG9uc2U6IHJlc3BvbnNlfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh3ZWJsYXRlVG9Db3VudGVycGFydChKU09OLnBhcnNlKGJvZHkpKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICApO1xuICAgIH0pO1xufVxuIl19