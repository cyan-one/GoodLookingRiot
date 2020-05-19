"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classnames = _interopRequireDefault(require("classnames"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _model = _interopRequireDefault(require("../../../editor/model"));

var _history = _interopRequireDefault(require("../../../editor/history"));

var _caret = require("../../../editor/caret");

var _operations = require("../../../editor/operations");

var _dom = require("../../../editor/dom");

var _Autocomplete = _interopRequireWildcard(require("../rooms/Autocomplete"));

var _parts = require("../../../editor/parts");

var _deserialize = require("../../../editor/deserialize");

var _render = require("../../../editor/render");

var _matrixJsSdk = require("matrix-js-sdk");

var _TypingStore = _interopRequireDefault(require("../../../stores/TypingStore"));

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _emoticon = _interopRequireDefault(require("emojibase-regex/emoticon"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _Keyboard = require("../../../Keyboard");

var _emoji = require("../../../emoji");

var _SlashCommands = require("../../../SlashCommands");

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
const REGEX_EMOTICON_WHITESPACE = new RegExp('(?:^|\\s)(' + _emoticon.default.source + ')\\s$');
const IS_MAC = navigator.platform.indexOf("Mac") !== -1;

function ctrlShortcutLabel(key) {
  return (IS_MAC ? "⌘" : "Ctrl") + "+" + key;
}

function cloneSelection(selection) {
  return {
    anchorNode: selection.anchorNode,
    anchorOffset: selection.anchorOffset,
    focusNode: selection.focusNode,
    focusOffset: selection.focusOffset,
    isCollapsed: selection.isCollapsed,
    rangeCount: selection.rangeCount,
    type: selection.type
  };
}

function selectionEquals(a
/*: Selection*/
, b
/*: Selection*/
)
/*: boolean*/
{
  return a.anchorNode === b.anchorNode && a.anchorOffset === b.anchorOffset && a.focusNode === b.focusNode && a.focusOffset === b.focusOffset && a.isCollapsed === b.isCollapsed && a.rangeCount === b.rangeCount && a.type === b.type;
}

class BasicMessageEditor extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_replaceEmoticon", (caretPosition, inputType, diff) => {
      const {
        model
      } = this.props;
      const range = model.startRange(caretPosition); // expand range max 8 characters backwards from caretPosition,
      // as a space to look for an emoticon

      let n = 8;
      range.expandBackwardsWhile((index, offset) => {
        const part = model.parts[index];
        n -= 1;
        return n >= 0 && (part.type === "plain" || part.type === "pill-candidate");
      });
      const emoticonMatch = REGEX_EMOTICON_WHITESPACE.exec(range.text);

      if (emoticonMatch) {
        const query = emoticonMatch[1].replace("-", ""); // try both exact match and lower-case, this means that xd won't match xD but :P will match :p

        const data = _emoji.EMOTICON_TO_EMOJI.get(query) || _emoji.EMOTICON_TO_EMOJI.get(query.toLowerCase());

        if (data) {
          const {
            partCreator
          } = model;
          const hasPrecedingSpace = emoticonMatch[0][0] === " "; // we need the range to only comprise of the emoticon
          // because we'll replace the whole range with an emoji,
          // so move the start forward to the start of the emoticon.
          // Take + 1 because index is reported without the possible preceding space.

          range.moveStart(emoticonMatch.index + (hasPrecedingSpace ? 1 : 0)); // this returns the amount of added/removed characters during the replace
          // so the caret position can be adjusted.

          return range.replace([partCreator.plain(data.unicode + " ")]);
        }
      }
    });
    (0, _defineProperty2.default)(this, "_updateEditorState", (selection, inputType, diff) => {
      (0, _render.renderModel)(this._editorRef, this.props.model);

      if (selection) {
        // set the caret/selection
        try {
          (0, _caret.setSelection)(this._editorRef, this.props.model, selection);
        } catch (err) {
          console.error(err);
        } // if caret selection is a range, take the end position


        const position = selection.end || selection;

        this._setLastCaretFromPosition(position);
      }

      const {
        isEmpty
      } = this.props.model;

      if (this.props.placeholder) {
        if (isEmpty) {
          this._showPlaceholder();
        } else {
          this._hidePlaceholder();
        }
      }

      if (isEmpty) {
        this._formatBarRef.hide();
      }

      this.setState({
        autoComplete: this.props.model.autoComplete
      });
      this.historyManager.tryPush(this.props.model, selection, inputType, diff);
      let isTyping = !this.props.model.isEmpty; // If the user is entering a command, only consider them typing if it is one which sends a message into the room

      if (isTyping && this.props.model.parts[0].type === "command") {
        const {
          cmd
        } = (0, _SlashCommands.parseCommandString)(this.props.model.parts[0].text);

        if (!_SlashCommands.CommandMap.has(cmd) || _SlashCommands.CommandMap.get(cmd).category !== _SlashCommands.CommandCategories.messages) {
          isTyping = false;
        }
      }

      _TypingStore.default.sharedInstance().setSelfTyping(this.props.room.roomId, isTyping);

      if (this.props.onChange) {
        this.props.onChange();
      }
    });
    (0, _defineProperty2.default)(this, "_onCompositionStart", event => {
      this._isIMEComposing = true; // even if the model is empty, the composition text shouldn't be mixed with the placeholder

      this._hidePlaceholder();
    });
    (0, _defineProperty2.default)(this, "_onCompositionEnd", event => {
      this._isIMEComposing = false; // some browsers (Chrome) don't fire an input event after ending a composition,
      // so trigger a model update after the composition is done by calling the input handler.
      // however, modifying the DOM (caused by the editor model update) from the compositionend handler seems
      // to confuse the IME in Chrome, likely causing https://github.com/vector-im/riot-web/issues/10913 ,
      // so we do it async
      // however, doing this async seems to break things in Safari for some reason, so browser sniff.

      const ua = navigator.userAgent.toLowerCase();
      const isSafari = ua.includes('safari/') && !ua.includes('chrome/');

      if (isSafari) {
        this._onInput({
          inputType: "insertCompositionText"
        });
      } else {
        Promise.resolve().then(() => {
          this._onInput({
            inputType: "insertCompositionText"
          });
        });
      }
    });
    (0, _defineProperty2.default)(this, "_onCutCopy", (event, type) => {
      const selection = document.getSelection();
      const text = selection.toString();

      if (text) {
        const {
          model
        } = this.props;
        const range = (0, _dom.getRangeForSelection)(this._editorRef, model, selection);
        const selectedParts = range.parts.map(p => p.serialize());
        event.clipboardData.setData("application/x-riot-composer", JSON.stringify(selectedParts));
        event.clipboardData.setData("text/plain", text); // so plain copy/paste works

        if (type === "cut") {
          // Remove the text, updating the model as appropriate
          this._modifiedFlag = true;
          (0, _operations.replaceRangeAndMoveCaret)(range, []);
        }

        event.preventDefault();
      }
    });
    (0, _defineProperty2.default)(this, "_onCopy", event => {
      this._onCutCopy(event, "copy");
    });
    (0, _defineProperty2.default)(this, "_onCut", event => {
      this._onCutCopy(event, "cut");
    });
    (0, _defineProperty2.default)(this, "_onPaste", event => {
      const {
        model
      } = this.props;
      const {
        partCreator
      } = model;
      const partsText = event.clipboardData.getData("application/x-riot-composer");
      let parts;

      if (partsText) {
        const serializedTextParts = JSON.parse(partsText);
        const deserializedParts = serializedTextParts.map(p => partCreator.deserializePart(p));
        parts = deserializedParts;
      } else {
        const text = event.clipboardData.getData("text/plain");
        parts = (0, _deserialize.parsePlainTextMessage)(text, partCreator);
      }

      this._modifiedFlag = true;
      const range = (0, _dom.getRangeForSelection)(this._editorRef, model, document.getSelection());
      (0, _operations.replaceRangeAndMoveCaret)(range, parts);
      event.preventDefault();
    });
    (0, _defineProperty2.default)(this, "_onInput", event => {
      // ignore any input while doing IME compositions
      if (this._isIMEComposing) {
        return;
      }

      this._modifiedFlag = true;
      const sel = document.getSelection();
      const {
        caret,
        text
      } = (0, _dom.getCaretOffsetAndText)(this._editorRef, sel);
      this.props.model.update(text, event.inputType, caret);
    });
    (0, _defineProperty2.default)(this, "_onBlur", () => {
      document.removeEventListener("selectionchange", this._onSelectionChange);
    });
    (0, _defineProperty2.default)(this, "_onFocus", () => {
      document.addEventListener("selectionchange", this._onSelectionChange); // force to recalculate

      this._lastSelection = null;

      this._refreshLastCaretIfNeeded();
    });
    (0, _defineProperty2.default)(this, "_onSelectionChange", () => {
      this._refreshLastCaretIfNeeded();

      const selection = document.getSelection();

      if (this._hasTextSelected && selection.isCollapsed) {
        this._hasTextSelected = false;

        if (this._formatBarRef) {
          this._formatBarRef.hide();
        }
      } else if (!selection.isCollapsed) {
        this._hasTextSelected = true;

        if (this._formatBarRef) {
          const selectionRect = selection.getRangeAt(0).getBoundingClientRect();

          this._formatBarRef.showAt(selectionRect);
        }
      }
    });
    (0, _defineProperty2.default)(this, "_onKeyDown", event => {
      const model = this.props.model;
      const modKey = IS_MAC ? event.metaKey : event.ctrlKey;
      let handled = false; // format bold

      if (modKey && event.key === _Keyboard.Key.B) {
        this._onFormatAction("bold");

        handled = true; // format italics
      } else if (modKey && event.key === _Keyboard.Key.I) {
        this._onFormatAction("italics");

        handled = true; // format quote
      } else if (modKey && event.key === _Keyboard.Key.GREATER_THAN) {
        this._onFormatAction("quote");

        handled = true; // redo
      } else if (!IS_MAC && modKey && event.key === _Keyboard.Key.Y || IS_MAC && modKey && event.shiftKey && event.key === _Keyboard.Key.Z) {
        if (this.historyManager.canRedo()) {
          const {
            parts,
            caret
          } = this.historyManager.redo(); // pass matching inputType so historyManager doesn't push echo
          // when invoked from rerender callback.

          model.reset(parts, caret, "historyRedo");
        }

        handled = true; // undo
      } else if (modKey && event.key === _Keyboard.Key.Z) {
        if (this.historyManager.canUndo()) {
          const {
            parts,
            caret
          } = this.historyManager.undo(this.props.model); // pass matching inputType so historyManager doesn't push echo
          // when invoked from rerender callback.

          model.reset(parts, caret, "historyUndo");
        }

        handled = true; // insert newline on Shift+Enter
      } else if (event.key === _Keyboard.Key.ENTER && (event.shiftKey || IS_MAC && event.altKey)) {
        this._insertText("\n");

        handled = true; // move selection to start of composer
      } else if (modKey && event.key === _Keyboard.Key.HOME && !event.shiftKey) {
        (0, _caret.setSelection)(this._editorRef, model, {
          index: 0,
          offset: 0
        });
        handled = true; // move selection to end of composer
      } else if (modKey && event.key === _Keyboard.Key.END && !event.shiftKey) {
        (0, _caret.setSelection)(this._editorRef, model, {
          index: model.parts.length - 1,
          offset: model.parts[model.parts.length - 1].text.length
        });
        handled = true; // autocomplete or enter to send below shouldn't have any modifier keys pressed.
      } else {
        const metaOrAltPressed = event.metaKey || event.altKey;
        const modifierPressed = metaOrAltPressed || event.shiftKey;

        if (model.autoComplete && model.autoComplete.hasCompletions()) {
          const autoComplete = model.autoComplete;

          switch (event.key) {
            case _Keyboard.Key.ARROW_UP:
              if (!modifierPressed) {
                autoComplete.onUpArrow(event);
                handled = true;
              }

              break;

            case _Keyboard.Key.ARROW_DOWN:
              if (!modifierPressed) {
                autoComplete.onDownArrow(event);
                handled = true;
              }

              break;

            case _Keyboard.Key.TAB:
              if (!metaOrAltPressed) {
                autoComplete.onTab(event);
                handled = true;
              }

              break;

            case _Keyboard.Key.ESCAPE:
              if (!modifierPressed) {
                autoComplete.onEscape(event);
                handled = true;
              }

              break;

            default:
              return;
            // don't preventDefault on anything else
          }
        } else if (event.key === _Keyboard.Key.TAB) {
          this._tabCompleteName();

          handled = true;
        } else if (event.key === _Keyboard.Key.BACKSPACE || event.key === _Keyboard.Key.DELETE) {
          this._formatBarRef.hide();
        }
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
    (0, _defineProperty2.default)(this, "_onAutoCompleteConfirm", completion => {
      this.props.model.autoComplete.onComponentConfirm(completion);
    });
    (0, _defineProperty2.default)(this, "_onAutoCompleteSelectionChange", (completion, completionIndex) => {
      this.props.model.autoComplete.onComponentSelectionChange(completion);
      this.setState({
        completionIndex
      });
    });
    (0, _defineProperty2.default)(this, "_configureEmoticonAutoReplace", () => {
      const shouldReplace = _SettingsStore.default.getValue('MessageComposerInput.autoReplaceEmoji');

      this.props.model.setTransformCallback(shouldReplace ? this._replaceEmoticon : null);
    });
    (0, _defineProperty2.default)(this, "_configureShouldShowPillAvatar", () => {
      const showPillAvatar = _SettingsStore.default.getValue("Pill.shouldShowPillAvatar");

      this.setState({
        showPillAvatar
      });
    });
    (0, _defineProperty2.default)(this, "_onFormatAction", action => {
      const range = (0, _dom.getRangeForSelection)(this._editorRef, this.props.model, document.getSelection());

      if (range.length === 0) {
        return;
      }

      this.historyManager.ensureLastChangesPushed(this.props.model);
      this._modifiedFlag = true;

      switch (action) {
        case "bold":
          (0, _operations.toggleInlineFormat)(range, "**");
          break;

        case "italics":
          (0, _operations.toggleInlineFormat)(range, "_");
          break;

        case "strikethrough":
          (0, _operations.toggleInlineFormat)(range, "<del>", "</del>");
          break;

        case "code":
          (0, _operations.formatRangeAsCode)(range);
          break;

        case "quote":
          (0, _operations.formatRangeAsQuote)(range);
          break;
      }
    });
    this.state = {
      autoComplete: null,
      showPillAvatar: _SettingsStore.default.getValue("Pill.shouldShowPillAvatar")
    };
    this._editorRef = null;
    this._autocompleteRef = null;
    this._formatBarRef = null;
    this._modifiedFlag = false;
    this._isIMEComposing = false;
    this._hasTextSelected = false;
    this._emoticonSettingHandle = null;
    this._shouldShowPillAvatarSettingHandle = null;
  }

  componentDidUpdate(prevProps) {
    if (this.props.placeholder !== prevProps.placeholder && this.props.placeholder) {
      const {
        isEmpty
      } = this.props.model;

      if (isEmpty) {
        this._showPlaceholder();
      } else {
        this._hidePlaceholder();
      }
    }
  }

  _showPlaceholder() {
    this._editorRef.style.setProperty("--placeholder", "'".concat(this.props.placeholder, "'"));

    this._editorRef.classList.add("mx_BasicMessageComposer_inputEmpty");
  }

  _hidePlaceholder() {
    this._editorRef.classList.remove("mx_BasicMessageComposer_inputEmpty");

    this._editorRef.style.removeProperty("--placeholder");
  }

  isComposing(event) {
    // checking the event.isComposing flag just in case any browser out there
    // emits events related to the composition after compositionend
    // has been fired
    return !!(this._isIMEComposing || event.nativeEvent && event.nativeEvent.isComposing);
  }

  _insertText(textToInsert, inputType = "insertText") {
    const sel = document.getSelection();
    const {
      caret,
      text
    } = (0, _dom.getCaretOffsetAndText)(this._editorRef, sel);
    const newText = text.substr(0, caret.offset) + textToInsert + text.substr(caret.offset);
    caret.offset += textToInsert.length;
    this._modifiedFlag = true;
    this.props.model.update(newText, inputType, caret);
  } // this is used later to see if we need to recalculate the caret
  // on selectionchange. If it is just a consequence of typing
  // we don't need to. But if the user is navigating the caret without input
  // we need to recalculate it, to be able to know where to insert content after
  // losing focus


  _setLastCaretFromPosition(position) {
    const {
      model
    } = this.props;
    this._isCaretAtEnd = position.isAtEnd(model);
    this._lastCaret = position.asOffset(model);
    this._lastSelection = cloneSelection(document.getSelection());
  }

  _refreshLastCaretIfNeeded() {
    // XXX: needed when going up and down in editing messages ... not sure why yet
    // because the editors should stop doing this when when blurred ...
    // maybe it's on focus and the _editorRef isn't available yet or something.
    if (!this._editorRef) {
      return;
    }

    const selection = document.getSelection();

    if (!this._lastSelection || !selectionEquals(this._lastSelection, selection)) {
      this._lastSelection = cloneSelection(selection);
      const {
        caret,
        text
      } = (0, _dom.getCaretOffsetAndText)(this._editorRef, selection);
      this._lastCaret = caret;
      this._isCaretAtEnd = caret.offset === text.length;
    }

    return this._lastCaret;
  }

  clearUndoHistory() {
    this.historyManager.clear();
  }

  getCaret() {
    return this._lastCaret;
  }

  isSelectionCollapsed() {
    return !this._lastSelection || this._lastSelection.isCollapsed;
  }

  isCaretAtStart() {
    return this.getCaret().offset === 0;
  }

  isCaretAtEnd() {
    return this._isCaretAtEnd;
  }

  async _tabCompleteName() {
    try {
      await new Promise(resolve => this.setState({
        showVisualBell: false
      }, resolve));
      const {
        model
      } = this.props;
      const caret = this.getCaret();
      const position = model.positionForOffset(caret.offset, caret.atNodeEnd);
      const range = model.startRange(position);
      range.expandBackwardsWhile((index, offset, part) => {
        return part.text[offset] !== " " && (part.type === "plain" || part.type === "pill-candidate" || part.type === "command");
      });
      const {
        partCreator
      } = model; // await for auto-complete to be open

      await model.transform(() => {
        const addedLen = range.replace([partCreator.pillCandidate(range.text)]);
        return model.positionForOffset(caret.offset + addedLen, true);
      }); // Don't try to do things with the autocomplete if there is none shown

      if (model.autoComplete) {
        await model.autoComplete.onTab();

        if (!model.autoComplete.hasSelection()) {
          this.setState({
            showVisualBell: true
          });
          model.autoComplete.close();
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  getEditableRootNode() {
    return this._editorRef;
  }

  isModified() {
    return this._modifiedFlag;
  }

  componentWillUnmount() {
    document.removeEventListener("selectionchange", this._onSelectionChange);

    this._editorRef.removeEventListener("input", this._onInput, true);

    this._editorRef.removeEventListener("compositionstart", this._onCompositionStart, true);

    this._editorRef.removeEventListener("compositionend", this._onCompositionEnd, true);

    _SettingsStore.default.unwatchSetting(this._emoticonSettingHandle);

    _SettingsStore.default.unwatchSetting(this._shouldShowPillAvatarSettingHandle);
  }

  componentDidMount() {
    const model = this.props.model;
    model.setUpdateCallback(this._updateEditorState);
    this._emoticonSettingHandle = _SettingsStore.default.watchSetting('MessageComposerInput.autoReplaceEmoji', null, this._configureEmoticonAutoReplace);

    this._configureEmoticonAutoReplace();

    this._shouldShowPillAvatarSettingHandle = _SettingsStore.default.watchSetting("Pill.shouldShowPillAvatar", null, this._configureShouldShowPillAvatar);
    const partCreator = model.partCreator; // TODO: does this allow us to get rid of EditorStateTransfer?
    // not really, but we could not serialize the parts, and just change the autoCompleter

    partCreator.setAutoCompleteCreator((0, _parts.autoCompleteCreator)(() => this._autocompleteRef, query => new Promise(resolve => this.setState({
      query
    }, resolve))));
    this.historyManager = new _history.default(partCreator); // initial render of model

    this._updateEditorState(this._getInitialCaretPosition()); // attach input listener by hand so React doesn't proxy the events,
    // as the proxied event doesn't support inputType, which we need.


    this._editorRef.addEventListener("input", this._onInput, true);

    this._editorRef.addEventListener("compositionstart", this._onCompositionStart, true);

    this._editorRef.addEventListener("compositionend", this._onCompositionEnd, true);

    this._editorRef.focus();
  }

  _getInitialCaretPosition() {
    let caretPosition;

    if (this.props.initialCaret) {
      // if restoring state from a previous editor,
      // restore caret position from the state
      const caret = this.props.initialCaret;
      caretPosition = this.props.model.positionForOffset(caret.offset, caret.atNodeEnd);
    } else {
      // otherwise, set it at the end
      caretPosition = this.props.model.getPositionAtEnd();
    }

    return caretPosition;
  }

  render() {
    let autoComplete;

    if (this.state.autoComplete) {
      const query = this.state.query;
      const queryLen = query.length;
      autoComplete = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_BasicMessageComposer_AutoCompleteWrapper"
      }, /*#__PURE__*/_react.default.createElement(_Autocomplete.default, {
        ref: ref => this._autocompleteRef = ref,
        query: query,
        onConfirm: this._onAutoCompleteConfirm,
        onSelectionChange: this._onAutoCompleteSelectionChange,
        selection: {
          beginning: true,
          end: queryLen,
          start: queryLen
        },
        room: this.props.room
      }));
    }

    const wrapperClasses = (0, _classnames.default)("mx_BasicMessageComposer", {
      "mx_BasicMessageComposer_input_error": this.state.showVisualBell
    });
    const classes = (0, _classnames.default)("mx_BasicMessageComposer_input", {
      "mx_BasicMessageComposer_input_shouldShowPillAvatar": this.state.showPillAvatar
    });
    const MessageComposerFormatBar = sdk.getComponent('rooms.MessageComposerFormatBar');
    const shortcuts = {
      bold: ctrlShortcutLabel("B"),
      italics: ctrlShortcutLabel("I"),
      quote: ctrlShortcutLabel(">")
    };
    const {
      completionIndex
    } = this.state;
    return /*#__PURE__*/_react.default.createElement("div", {
      className: wrapperClasses
    }, autoComplete, /*#__PURE__*/_react.default.createElement(MessageComposerFormatBar, {
      ref: ref => this._formatBarRef = ref,
      onAction: this._onFormatAction,
      shortcuts: shortcuts
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: classes,
      contentEditable: "true",
      tabIndex: "0",
      onBlur: this._onBlur,
      onFocus: this._onFocus,
      onCopy: this._onCopy,
      onCut: this._onCut,
      onPaste: this._onPaste,
      onKeyDown: this._onKeyDown,
      ref: ref => this._editorRef = ref,
      "aria-label": this.props.label,
      role: "textbox",
      "aria-multiline": "true",
      "aria-autocomplete": "both",
      "aria-haspopup": "listbox",
      "aria-expanded": Boolean(this.state.autoComplete),
      "aria-activedescendant": completionIndex >= 0 ? (0, _Autocomplete.generateCompletionDomId)(completionIndex) : undefined,
      dir: "auto"
    }));
  }

  focus() {
    this._editorRef.focus();
  }

}

exports.default = BasicMessageEditor;
(0, _defineProperty2.default)(BasicMessageEditor, "propTypes", {
  onChange: _propTypes.default.func,
  model: _propTypes.default.instanceOf(_model.default).isRequired,
  room: _propTypes.default.instanceOf(_matrixJsSdk.Room).isRequired,
  placeholder: _propTypes.default.string,
  label: _propTypes.default.string,
  // the aria label
  initialCaret: _propTypes.default.object // See DocumentPosition in editor/model.js

});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL0Jhc2ljTWVzc2FnZUNvbXBvc2VyLmpzIl0sIm5hbWVzIjpbIlJFR0VYX0VNT1RJQ09OX1dISVRFU1BBQ0UiLCJSZWdFeHAiLCJFTU9USUNPTl9SRUdFWCIsInNvdXJjZSIsIklTX01BQyIsIm5hdmlnYXRvciIsInBsYXRmb3JtIiwiaW5kZXhPZiIsImN0cmxTaG9ydGN1dExhYmVsIiwia2V5IiwiY2xvbmVTZWxlY3Rpb24iLCJzZWxlY3Rpb24iLCJhbmNob3JOb2RlIiwiYW5jaG9yT2Zmc2V0IiwiZm9jdXNOb2RlIiwiZm9jdXNPZmZzZXQiLCJpc0NvbGxhcHNlZCIsInJhbmdlQ291bnQiLCJ0eXBlIiwic2VsZWN0aW9uRXF1YWxzIiwiYSIsImIiLCJCYXNpY01lc3NhZ2VFZGl0b3IiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJjYXJldFBvc2l0aW9uIiwiaW5wdXRUeXBlIiwiZGlmZiIsIm1vZGVsIiwicmFuZ2UiLCJzdGFydFJhbmdlIiwibiIsImV4cGFuZEJhY2t3YXJkc1doaWxlIiwiaW5kZXgiLCJvZmZzZXQiLCJwYXJ0IiwicGFydHMiLCJlbW90aWNvbk1hdGNoIiwiZXhlYyIsInRleHQiLCJxdWVyeSIsInJlcGxhY2UiLCJkYXRhIiwiRU1PVElDT05fVE9fRU1PSkkiLCJnZXQiLCJ0b0xvd2VyQ2FzZSIsInBhcnRDcmVhdG9yIiwiaGFzUHJlY2VkaW5nU3BhY2UiLCJtb3ZlU3RhcnQiLCJwbGFpbiIsInVuaWNvZGUiLCJfZWRpdG9yUmVmIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwicG9zaXRpb24iLCJlbmQiLCJfc2V0TGFzdENhcmV0RnJvbVBvc2l0aW9uIiwiaXNFbXB0eSIsInBsYWNlaG9sZGVyIiwiX3Nob3dQbGFjZWhvbGRlciIsIl9oaWRlUGxhY2Vob2xkZXIiLCJfZm9ybWF0QmFyUmVmIiwiaGlkZSIsInNldFN0YXRlIiwiYXV0b0NvbXBsZXRlIiwiaGlzdG9yeU1hbmFnZXIiLCJ0cnlQdXNoIiwiaXNUeXBpbmciLCJjbWQiLCJDb21tYW5kTWFwIiwiaGFzIiwiY2F0ZWdvcnkiLCJDb21tYW5kQ2F0ZWdvcmllcyIsIm1lc3NhZ2VzIiwiVHlwaW5nU3RvcmUiLCJzaGFyZWRJbnN0YW5jZSIsInNldFNlbGZUeXBpbmciLCJyb29tIiwicm9vbUlkIiwib25DaGFuZ2UiLCJldmVudCIsIl9pc0lNRUNvbXBvc2luZyIsInVhIiwidXNlckFnZW50IiwiaXNTYWZhcmkiLCJpbmNsdWRlcyIsIl9vbklucHV0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0aGVuIiwiZG9jdW1lbnQiLCJnZXRTZWxlY3Rpb24iLCJ0b1N0cmluZyIsInNlbGVjdGVkUGFydHMiLCJtYXAiLCJwIiwic2VyaWFsaXplIiwiY2xpcGJvYXJkRGF0YSIsInNldERhdGEiLCJKU09OIiwic3RyaW5naWZ5IiwiX21vZGlmaWVkRmxhZyIsInByZXZlbnREZWZhdWx0IiwiX29uQ3V0Q29weSIsInBhcnRzVGV4dCIsImdldERhdGEiLCJzZXJpYWxpemVkVGV4dFBhcnRzIiwicGFyc2UiLCJkZXNlcmlhbGl6ZWRQYXJ0cyIsImRlc2VyaWFsaXplUGFydCIsInNlbCIsImNhcmV0IiwidXBkYXRlIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsIl9vblNlbGVjdGlvbkNoYW5nZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJfbGFzdFNlbGVjdGlvbiIsIl9yZWZyZXNoTGFzdENhcmV0SWZOZWVkZWQiLCJfaGFzVGV4dFNlbGVjdGVkIiwic2VsZWN0aW9uUmVjdCIsImdldFJhbmdlQXQiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJzaG93QXQiLCJtb2RLZXkiLCJtZXRhS2V5IiwiY3RybEtleSIsImhhbmRsZWQiLCJLZXkiLCJCIiwiX29uRm9ybWF0QWN0aW9uIiwiSSIsIkdSRUFURVJfVEhBTiIsIlkiLCJzaGlmdEtleSIsIloiLCJjYW5SZWRvIiwicmVkbyIsInJlc2V0IiwiY2FuVW5kbyIsInVuZG8iLCJFTlRFUiIsImFsdEtleSIsIl9pbnNlcnRUZXh0IiwiSE9NRSIsIkVORCIsImxlbmd0aCIsIm1ldGFPckFsdFByZXNzZWQiLCJtb2RpZmllclByZXNzZWQiLCJoYXNDb21wbGV0aW9ucyIsIkFSUk9XX1VQIiwib25VcEFycm93IiwiQVJST1dfRE9XTiIsIm9uRG93bkFycm93IiwiVEFCIiwib25UYWIiLCJFU0NBUEUiLCJvbkVzY2FwZSIsIl90YWJDb21wbGV0ZU5hbWUiLCJCQUNLU1BBQ0UiLCJERUxFVEUiLCJzdG9wUHJvcGFnYXRpb24iLCJjb21wbGV0aW9uIiwib25Db21wb25lbnRDb25maXJtIiwiY29tcGxldGlvbkluZGV4Iiwib25Db21wb25lbnRTZWxlY3Rpb25DaGFuZ2UiLCJzaG91bGRSZXBsYWNlIiwiU2V0dGluZ3NTdG9yZSIsImdldFZhbHVlIiwic2V0VHJhbnNmb3JtQ2FsbGJhY2siLCJfcmVwbGFjZUVtb3RpY29uIiwic2hvd1BpbGxBdmF0YXIiLCJhY3Rpb24iLCJlbnN1cmVMYXN0Q2hhbmdlc1B1c2hlZCIsInN0YXRlIiwiX2F1dG9jb21wbGV0ZVJlZiIsIl9lbW90aWNvblNldHRpbmdIYW5kbGUiLCJfc2hvdWxkU2hvd1BpbGxBdmF0YXJTZXR0aW5nSGFuZGxlIiwiY29tcG9uZW50RGlkVXBkYXRlIiwicHJldlByb3BzIiwic3R5bGUiLCJzZXRQcm9wZXJ0eSIsImNsYXNzTGlzdCIsImFkZCIsInJlbW92ZSIsInJlbW92ZVByb3BlcnR5IiwiaXNDb21wb3NpbmciLCJuYXRpdmVFdmVudCIsInRleHRUb0luc2VydCIsIm5ld1RleHQiLCJzdWJzdHIiLCJfaXNDYXJldEF0RW5kIiwiaXNBdEVuZCIsIl9sYXN0Q2FyZXQiLCJhc09mZnNldCIsImNsZWFyVW5kb0hpc3RvcnkiLCJjbGVhciIsImdldENhcmV0IiwiaXNTZWxlY3Rpb25Db2xsYXBzZWQiLCJpc0NhcmV0QXRTdGFydCIsImlzQ2FyZXRBdEVuZCIsInNob3dWaXN1YWxCZWxsIiwicG9zaXRpb25Gb3JPZmZzZXQiLCJhdE5vZGVFbmQiLCJ0cmFuc2Zvcm0iLCJhZGRlZExlbiIsInBpbGxDYW5kaWRhdGUiLCJoYXNTZWxlY3Rpb24iLCJjbG9zZSIsImdldEVkaXRhYmxlUm9vdE5vZGUiLCJpc01vZGlmaWVkIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJfb25Db21wb3NpdGlvblN0YXJ0IiwiX29uQ29tcG9zaXRpb25FbmQiLCJ1bndhdGNoU2V0dGluZyIsImNvbXBvbmVudERpZE1vdW50Iiwic2V0VXBkYXRlQ2FsbGJhY2siLCJfdXBkYXRlRWRpdG9yU3RhdGUiLCJ3YXRjaFNldHRpbmciLCJfY29uZmlndXJlRW1vdGljb25BdXRvUmVwbGFjZSIsIl9jb25maWd1cmVTaG91bGRTaG93UGlsbEF2YXRhciIsInNldEF1dG9Db21wbGV0ZUNyZWF0b3IiLCJIaXN0b3J5TWFuYWdlciIsIl9nZXRJbml0aWFsQ2FyZXRQb3NpdGlvbiIsImZvY3VzIiwiaW5pdGlhbENhcmV0IiwiZ2V0UG9zaXRpb25BdEVuZCIsInJlbmRlciIsInF1ZXJ5TGVuIiwicmVmIiwiX29uQXV0b0NvbXBsZXRlQ29uZmlybSIsIl9vbkF1dG9Db21wbGV0ZVNlbGVjdGlvbkNoYW5nZSIsImJlZ2lubmluZyIsInN0YXJ0Iiwid3JhcHBlckNsYXNzZXMiLCJjbGFzc2VzIiwiTWVzc2FnZUNvbXBvc2VyRm9ybWF0QmFyIiwic2RrIiwiZ2V0Q29tcG9uZW50Iiwic2hvcnRjdXRzIiwiYm9sZCIsIml0YWxpY3MiLCJxdW90ZSIsIl9vbkJsdXIiLCJfb25Gb2N1cyIsIl9vbkNvcHkiLCJfb25DdXQiLCJfb25QYXN0ZSIsIl9vbktleURvd24iLCJsYWJlbCIsIkJvb2xlYW4iLCJ1bmRlZmluZWQiLCJQcm9wVHlwZXMiLCJmdW5jIiwiaW5zdGFuY2VPZiIsIkVkaXRvck1vZGVsIiwiaXNSZXF1aXJlZCIsIlJvb20iLCJzdHJpbmciLCJvYmplY3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBTUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBekNBOzs7Ozs7Ozs7Ozs7Ozs7O0FBMkNBLE1BQU1BLHlCQUF5QixHQUFHLElBQUlDLE1BQUosQ0FBVyxlQUFlQyxrQkFBZUMsTUFBOUIsR0FBdUMsT0FBbEQsQ0FBbEM7QUFFQSxNQUFNQyxNQUFNLEdBQUdDLFNBQVMsQ0FBQ0MsUUFBVixDQUFtQkMsT0FBbkIsQ0FBMkIsS0FBM0IsTUFBc0MsQ0FBQyxDQUF0RDs7QUFFQSxTQUFTQyxpQkFBVCxDQUEyQkMsR0FBM0IsRUFBZ0M7QUFDNUIsU0FBTyxDQUFDTCxNQUFNLEdBQUcsR0FBSCxHQUFTLE1BQWhCLElBQTBCLEdBQTFCLEdBQWdDSyxHQUF2QztBQUNIOztBQUVELFNBQVNDLGNBQVQsQ0FBd0JDLFNBQXhCLEVBQW1DO0FBQy9CLFNBQU87QUFDSEMsSUFBQUEsVUFBVSxFQUFFRCxTQUFTLENBQUNDLFVBRG5CO0FBRUhDLElBQUFBLFlBQVksRUFBRUYsU0FBUyxDQUFDRSxZQUZyQjtBQUdIQyxJQUFBQSxTQUFTLEVBQUVILFNBQVMsQ0FBQ0csU0FIbEI7QUFJSEMsSUFBQUEsV0FBVyxFQUFFSixTQUFTLENBQUNJLFdBSnBCO0FBS0hDLElBQUFBLFdBQVcsRUFBRUwsU0FBUyxDQUFDSyxXQUxwQjtBQU1IQyxJQUFBQSxVQUFVLEVBQUVOLFNBQVMsQ0FBQ00sVUFObkI7QUFPSEMsSUFBQUEsSUFBSSxFQUFFUCxTQUFTLENBQUNPO0FBUGIsR0FBUDtBQVNIOztBQUVELFNBQVNDLGVBQVQsQ0FBeUJDO0FBQXpCO0FBQUEsRUFBdUNDO0FBQXZDO0FBQUE7QUFBQTtBQUE4RDtBQUMxRCxTQUFPRCxDQUFDLENBQUNSLFVBQUYsS0FBaUJTLENBQUMsQ0FBQ1QsVUFBbkIsSUFDSFEsQ0FBQyxDQUFDUCxZQUFGLEtBQW1CUSxDQUFDLENBQUNSLFlBRGxCLElBRUhPLENBQUMsQ0FBQ04sU0FBRixLQUFnQk8sQ0FBQyxDQUFDUCxTQUZmLElBR0hNLENBQUMsQ0FBQ0wsV0FBRixLQUFrQk0sQ0FBQyxDQUFDTixXQUhqQixJQUlISyxDQUFDLENBQUNKLFdBQUYsS0FBa0JLLENBQUMsQ0FBQ0wsV0FKakIsSUFLSEksQ0FBQyxDQUFDSCxVQUFGLEtBQWlCSSxDQUFDLENBQUNKLFVBTGhCLElBTUhHLENBQUMsQ0FBQ0YsSUFBRixLQUFXRyxDQUFDLENBQUNILElBTmpCO0FBT0g7O0FBRWMsTUFBTUksa0JBQU4sU0FBaUNDLGVBQU1DLFNBQXZDLENBQWlEO0FBVTVEQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUTtBQUNmLFVBQU1BLEtBQU47QUFEZSw0REEyQkEsQ0FBQ0MsYUFBRCxFQUFnQkMsU0FBaEIsRUFBMkJDLElBQTNCLEtBQW9DO0FBQ25ELFlBQU07QUFBQ0MsUUFBQUE7QUFBRCxVQUFVLEtBQUtKLEtBQXJCO0FBQ0EsWUFBTUssS0FBSyxHQUFHRCxLQUFLLENBQUNFLFVBQU4sQ0FBaUJMLGFBQWpCLENBQWQsQ0FGbUQsQ0FHbkQ7QUFDQTs7QUFDQSxVQUFJTSxDQUFDLEdBQUcsQ0FBUjtBQUNBRixNQUFBQSxLQUFLLENBQUNHLG9CQUFOLENBQTJCLENBQUNDLEtBQUQsRUFBUUMsTUFBUixLQUFtQjtBQUMxQyxjQUFNQyxJQUFJLEdBQUdQLEtBQUssQ0FBQ1EsS0FBTixDQUFZSCxLQUFaLENBQWI7QUFDQUYsUUFBQUEsQ0FBQyxJQUFJLENBQUw7QUFDQSxlQUFPQSxDQUFDLElBQUksQ0FBTCxLQUFXSSxJQUFJLENBQUNuQixJQUFMLEtBQWMsT0FBZCxJQUF5Qm1CLElBQUksQ0FBQ25CLElBQUwsS0FBYyxnQkFBbEQsQ0FBUDtBQUNILE9BSkQ7QUFLQSxZQUFNcUIsYUFBYSxHQUFHdkMseUJBQXlCLENBQUN3QyxJQUExQixDQUErQlQsS0FBSyxDQUFDVSxJQUFyQyxDQUF0Qjs7QUFDQSxVQUFJRixhQUFKLEVBQW1CO0FBQ2YsY0FBTUcsS0FBSyxHQUFHSCxhQUFhLENBQUMsQ0FBRCxDQUFiLENBQWlCSSxPQUFqQixDQUF5QixHQUF6QixFQUE4QixFQUE5QixDQUFkLENBRGUsQ0FFZjs7QUFDQSxjQUFNQyxJQUFJLEdBQUdDLHlCQUFrQkMsR0FBbEIsQ0FBc0JKLEtBQXRCLEtBQWdDRyx5QkFBa0JDLEdBQWxCLENBQXNCSixLQUFLLENBQUNLLFdBQU4sRUFBdEIsQ0FBN0M7O0FBRUEsWUFBSUgsSUFBSixFQUFVO0FBQ04sZ0JBQU07QUFBQ0ksWUFBQUE7QUFBRCxjQUFnQmxCLEtBQXRCO0FBQ0EsZ0JBQU1tQixpQkFBaUIsR0FBR1YsYUFBYSxDQUFDLENBQUQsQ0FBYixDQUFpQixDQUFqQixNQUF3QixHQUFsRCxDQUZNLENBR047QUFDQTtBQUNBO0FBQ0E7O0FBQ0FSLFVBQUFBLEtBQUssQ0FBQ21CLFNBQU4sQ0FBZ0JYLGFBQWEsQ0FBQ0osS0FBZCxJQUF1QmMsaUJBQWlCLEdBQUcsQ0FBSCxHQUFPLENBQS9DLENBQWhCLEVBUE0sQ0FRTjtBQUNBOztBQUNBLGlCQUFPbEIsS0FBSyxDQUFDWSxPQUFOLENBQWMsQ0FBQ0ssV0FBVyxDQUFDRyxLQUFaLENBQWtCUCxJQUFJLENBQUNRLE9BQUwsR0FBZSxHQUFqQyxDQUFELENBQWQsQ0FBUDtBQUNIO0FBQ0o7QUFDSixLQXpEa0I7QUFBQSw4REEyREUsQ0FBQ3pDLFNBQUQsRUFBWWlCLFNBQVosRUFBdUJDLElBQXZCLEtBQWdDO0FBQ2pELCtCQUFZLEtBQUt3QixVQUFqQixFQUE2QixLQUFLM0IsS0FBTCxDQUFXSSxLQUF4Qzs7QUFDQSxVQUFJbkIsU0FBSixFQUFlO0FBQUU7QUFDYixZQUFJO0FBQ0EsbUNBQWEsS0FBSzBDLFVBQWxCLEVBQThCLEtBQUszQixLQUFMLENBQVdJLEtBQXpDLEVBQWdEbkIsU0FBaEQ7QUFDSCxTQUZELENBRUUsT0FBTzJDLEdBQVAsRUFBWTtBQUNWQyxVQUFBQSxPQUFPLENBQUNDLEtBQVIsQ0FBY0YsR0FBZDtBQUNILFNBTFUsQ0FNWDs7O0FBQ0EsY0FBTUcsUUFBUSxHQUFHOUMsU0FBUyxDQUFDK0MsR0FBVixJQUFpQi9DLFNBQWxDOztBQUNBLGFBQUtnRCx5QkFBTCxDQUErQkYsUUFBL0I7QUFDSDs7QUFDRCxZQUFNO0FBQUNHLFFBQUFBO0FBQUQsVUFBWSxLQUFLbEMsS0FBTCxDQUFXSSxLQUE3Qjs7QUFDQSxVQUFJLEtBQUtKLEtBQUwsQ0FBV21DLFdBQWYsRUFBNEI7QUFDeEIsWUFBSUQsT0FBSixFQUFhO0FBQ1QsZUFBS0UsZ0JBQUw7QUFDSCxTQUZELE1BRU87QUFDSCxlQUFLQyxnQkFBTDtBQUNIO0FBQ0o7O0FBQ0QsVUFBSUgsT0FBSixFQUFhO0FBQ1QsYUFBS0ksYUFBTCxDQUFtQkMsSUFBbkI7QUFDSDs7QUFDRCxXQUFLQyxRQUFMLENBQWM7QUFBQ0MsUUFBQUEsWUFBWSxFQUFFLEtBQUt6QyxLQUFMLENBQVdJLEtBQVgsQ0FBaUJxQztBQUFoQyxPQUFkO0FBQ0EsV0FBS0MsY0FBTCxDQUFvQkMsT0FBcEIsQ0FBNEIsS0FBSzNDLEtBQUwsQ0FBV0ksS0FBdkMsRUFBOENuQixTQUE5QyxFQUF5RGlCLFNBQXpELEVBQW9FQyxJQUFwRTtBQUVBLFVBQUl5QyxRQUFRLEdBQUcsQ0FBQyxLQUFLNUMsS0FBTCxDQUFXSSxLQUFYLENBQWlCOEIsT0FBakMsQ0ExQmlELENBMkJqRDs7QUFDQSxVQUFJVSxRQUFRLElBQUksS0FBSzVDLEtBQUwsQ0FBV0ksS0FBWCxDQUFpQlEsS0FBakIsQ0FBdUIsQ0FBdkIsRUFBMEJwQixJQUExQixLQUFtQyxTQUFuRCxFQUE4RDtBQUMxRCxjQUFNO0FBQUNxRCxVQUFBQTtBQUFELFlBQVEsdUNBQW1CLEtBQUs3QyxLQUFMLENBQVdJLEtBQVgsQ0FBaUJRLEtBQWpCLENBQXVCLENBQXZCLEVBQTBCRyxJQUE3QyxDQUFkOztBQUNBLFlBQUksQ0FBQytCLDBCQUFXQyxHQUFYLENBQWVGLEdBQWYsQ0FBRCxJQUF3QkMsMEJBQVcxQixHQUFYLENBQWV5QixHQUFmLEVBQW9CRyxRQUFwQixLQUFpQ0MsaUNBQWtCQyxRQUEvRSxFQUF5RjtBQUNyRk4sVUFBQUEsUUFBUSxHQUFHLEtBQVg7QUFDSDtBQUNKOztBQUNETywyQkFBWUMsY0FBWixHQUE2QkMsYUFBN0IsQ0FBMkMsS0FBS3JELEtBQUwsQ0FBV3NELElBQVgsQ0FBZ0JDLE1BQTNELEVBQW1FWCxRQUFuRTs7QUFFQSxVQUFJLEtBQUs1QyxLQUFMLENBQVd3RCxRQUFmLEVBQXlCO0FBQ3JCLGFBQUt4RCxLQUFMLENBQVd3RCxRQUFYO0FBQ0g7QUFDSixLQWxHa0I7QUFBQSwrREE4R0lDLEtBQUQsSUFBVztBQUM3QixXQUFLQyxlQUFMLEdBQXVCLElBQXZCLENBRDZCLENBRTdCOztBQUNBLFdBQUtyQixnQkFBTDtBQUNILEtBbEhrQjtBQUFBLDZEQW9IRW9CLEtBQUQsSUFBVztBQUMzQixXQUFLQyxlQUFMLEdBQXVCLEtBQXZCLENBRDJCLENBRTNCO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTs7QUFFQSxZQUFNQyxFQUFFLEdBQUdoRixTQUFTLENBQUNpRixTQUFWLENBQW9CdkMsV0FBcEIsRUFBWDtBQUNBLFlBQU13QyxRQUFRLEdBQUdGLEVBQUUsQ0FBQ0csUUFBSCxDQUFZLFNBQVosS0FBMEIsQ0FBQ0gsRUFBRSxDQUFDRyxRQUFILENBQVksU0FBWixDQUE1Qzs7QUFFQSxVQUFJRCxRQUFKLEVBQWM7QUFDVixhQUFLRSxRQUFMLENBQWM7QUFBQzdELFVBQUFBLFNBQVMsRUFBRTtBQUFaLFNBQWQ7QUFDSCxPQUZELE1BRU87QUFDSDhELFFBQUFBLE9BQU8sQ0FBQ0MsT0FBUixHQUFrQkMsSUFBbEIsQ0FBdUIsTUFBTTtBQUN6QixlQUFLSCxRQUFMLENBQWM7QUFBQzdELFlBQUFBLFNBQVMsRUFBRTtBQUFaLFdBQWQ7QUFDSCxTQUZEO0FBR0g7QUFDSixLQXpJa0I7QUFBQSxzREFrSk4sQ0FBQ3VELEtBQUQsRUFBUWpFLElBQVIsS0FBaUI7QUFDMUIsWUFBTVAsU0FBUyxHQUFHa0YsUUFBUSxDQUFDQyxZQUFULEVBQWxCO0FBQ0EsWUFBTXJELElBQUksR0FBRzlCLFNBQVMsQ0FBQ29GLFFBQVYsRUFBYjs7QUFDQSxVQUFJdEQsSUFBSixFQUFVO0FBQ04sY0FBTTtBQUFDWCxVQUFBQTtBQUFELFlBQVUsS0FBS0osS0FBckI7QUFDQSxjQUFNSyxLQUFLLEdBQUcsK0JBQXFCLEtBQUtzQixVQUExQixFQUFzQ3ZCLEtBQXRDLEVBQTZDbkIsU0FBN0MsQ0FBZDtBQUNBLGNBQU1xRixhQUFhLEdBQUdqRSxLQUFLLENBQUNPLEtBQU4sQ0FBWTJELEdBQVosQ0FBZ0JDLENBQUMsSUFBSUEsQ0FBQyxDQUFDQyxTQUFGLEVBQXJCLENBQXRCO0FBQ0FoQixRQUFBQSxLQUFLLENBQUNpQixhQUFOLENBQW9CQyxPQUFwQixDQUE0Qiw2QkFBNUIsRUFBMkRDLElBQUksQ0FBQ0MsU0FBTCxDQUFlUCxhQUFmLENBQTNEO0FBQ0FiLFFBQUFBLEtBQUssQ0FBQ2lCLGFBQU4sQ0FBb0JDLE9BQXBCLENBQTRCLFlBQTVCLEVBQTBDNUQsSUFBMUMsRUFMTSxDQUsyQzs7QUFDakQsWUFBSXZCLElBQUksS0FBSyxLQUFiLEVBQW9CO0FBQ2hCO0FBQ0EsZUFBS3NGLGFBQUwsR0FBcUIsSUFBckI7QUFDQSxvREFBeUJ6RSxLQUF6QixFQUFnQyxFQUFoQztBQUNIOztBQUNEb0QsUUFBQUEsS0FBSyxDQUFDc0IsY0FBTjtBQUNIO0FBQ0osS0FsS2tCO0FBQUEsbURBb0tSdEIsS0FBRCxJQUFXO0FBQ2pCLFdBQUt1QixVQUFMLENBQWdCdkIsS0FBaEIsRUFBdUIsTUFBdkI7QUFDSCxLQXRLa0I7QUFBQSxrREF3S1RBLEtBQUQsSUFBVztBQUNoQixXQUFLdUIsVUFBTCxDQUFnQnZCLEtBQWhCLEVBQXVCLEtBQXZCO0FBQ0gsS0ExS2tCO0FBQUEsb0RBNEtQQSxLQUFELElBQVc7QUFDbEIsWUFBTTtBQUFDckQsUUFBQUE7QUFBRCxVQUFVLEtBQUtKLEtBQXJCO0FBQ0EsWUFBTTtBQUFDc0IsUUFBQUE7QUFBRCxVQUFnQmxCLEtBQXRCO0FBQ0EsWUFBTTZFLFNBQVMsR0FBR3hCLEtBQUssQ0FBQ2lCLGFBQU4sQ0FBb0JRLE9BQXBCLENBQTRCLDZCQUE1QixDQUFsQjtBQUNBLFVBQUl0RSxLQUFKOztBQUNBLFVBQUlxRSxTQUFKLEVBQWU7QUFDWCxjQUFNRSxtQkFBbUIsR0FBR1AsSUFBSSxDQUFDUSxLQUFMLENBQVdILFNBQVgsQ0FBNUI7QUFDQSxjQUFNSSxpQkFBaUIsR0FBR0YsbUJBQW1CLENBQUNaLEdBQXBCLENBQXdCQyxDQUFDLElBQUlsRCxXQUFXLENBQUNnRSxlQUFaLENBQTRCZCxDQUE1QixDQUE3QixDQUExQjtBQUNBNUQsUUFBQUEsS0FBSyxHQUFHeUUsaUJBQVI7QUFDSCxPQUpELE1BSU87QUFDSCxjQUFNdEUsSUFBSSxHQUFHMEMsS0FBSyxDQUFDaUIsYUFBTixDQUFvQlEsT0FBcEIsQ0FBNEIsWUFBNUIsQ0FBYjtBQUNBdEUsUUFBQUEsS0FBSyxHQUFHLHdDQUFzQkcsSUFBdEIsRUFBNEJPLFdBQTVCLENBQVI7QUFDSDs7QUFDRCxXQUFLd0QsYUFBTCxHQUFxQixJQUFyQjtBQUNBLFlBQU16RSxLQUFLLEdBQUcsK0JBQXFCLEtBQUtzQixVQUExQixFQUFzQ3ZCLEtBQXRDLEVBQTZDK0QsUUFBUSxDQUFDQyxZQUFULEVBQTdDLENBQWQ7QUFDQSxnREFBeUIvRCxLQUF6QixFQUFnQ08sS0FBaEM7QUFDQTZDLE1BQUFBLEtBQUssQ0FBQ3NCLGNBQU47QUFDSCxLQTdMa0I7QUFBQSxvREErTFB0QixLQUFELElBQVc7QUFDbEI7QUFDQSxVQUFJLEtBQUtDLGVBQVQsRUFBMEI7QUFDdEI7QUFDSDs7QUFDRCxXQUFLb0IsYUFBTCxHQUFxQixJQUFyQjtBQUNBLFlBQU1TLEdBQUcsR0FBR3BCLFFBQVEsQ0FBQ0MsWUFBVCxFQUFaO0FBQ0EsWUFBTTtBQUFDb0IsUUFBQUEsS0FBRDtBQUFRekUsUUFBQUE7QUFBUixVQUFnQixnQ0FBc0IsS0FBS1ksVUFBM0IsRUFBdUM0RCxHQUF2QyxDQUF0QjtBQUNBLFdBQUt2RixLQUFMLENBQVdJLEtBQVgsQ0FBaUJxRixNQUFqQixDQUF3QjFFLElBQXhCLEVBQThCMEMsS0FBSyxDQUFDdkQsU0FBcEMsRUFBK0NzRixLQUEvQztBQUNILEtBeE1rQjtBQUFBLG1EQW9RVCxNQUFNO0FBQ1pyQixNQUFBQSxRQUFRLENBQUN1QixtQkFBVCxDQUE2QixpQkFBN0IsRUFBZ0QsS0FBS0Msa0JBQXJEO0FBQ0gsS0F0UWtCO0FBQUEsb0RBd1FSLE1BQU07QUFDYnhCLE1BQUFBLFFBQVEsQ0FBQ3lCLGdCQUFULENBQTBCLGlCQUExQixFQUE2QyxLQUFLRCxrQkFBbEQsRUFEYSxDQUViOztBQUNBLFdBQUtFLGNBQUwsR0FBc0IsSUFBdEI7O0FBQ0EsV0FBS0MseUJBQUw7QUFDSCxLQTdRa0I7QUFBQSw4REErUUUsTUFBTTtBQUN2QixXQUFLQSx5QkFBTDs7QUFDQSxZQUFNN0csU0FBUyxHQUFHa0YsUUFBUSxDQUFDQyxZQUFULEVBQWxCOztBQUNBLFVBQUksS0FBSzJCLGdCQUFMLElBQXlCOUcsU0FBUyxDQUFDSyxXQUF2QyxFQUFvRDtBQUNoRCxhQUFLeUcsZ0JBQUwsR0FBd0IsS0FBeEI7O0FBQ0EsWUFBSSxLQUFLekQsYUFBVCxFQUF3QjtBQUNwQixlQUFLQSxhQUFMLENBQW1CQyxJQUFuQjtBQUNIO0FBQ0osT0FMRCxNQUtPLElBQUksQ0FBQ3RELFNBQVMsQ0FBQ0ssV0FBZixFQUE0QjtBQUMvQixhQUFLeUcsZ0JBQUwsR0FBd0IsSUFBeEI7O0FBQ0EsWUFBSSxLQUFLekQsYUFBVCxFQUF3QjtBQUNwQixnQkFBTTBELGFBQWEsR0FBRy9HLFNBQVMsQ0FBQ2dILFVBQVYsQ0FBcUIsQ0FBckIsRUFBd0JDLHFCQUF4QixFQUF0Qjs7QUFDQSxlQUFLNUQsYUFBTCxDQUFtQjZELE1BQW5CLENBQTBCSCxhQUExQjtBQUNIO0FBQ0o7QUFDSixLQTlSa0I7QUFBQSxzREFnU0x2QyxLQUFELElBQVc7QUFDcEIsWUFBTXJELEtBQUssR0FBRyxLQUFLSixLQUFMLENBQVdJLEtBQXpCO0FBQ0EsWUFBTWdHLE1BQU0sR0FBRzFILE1BQU0sR0FBRytFLEtBQUssQ0FBQzRDLE9BQVQsR0FBbUI1QyxLQUFLLENBQUM2QyxPQUE5QztBQUNBLFVBQUlDLE9BQU8sR0FBRyxLQUFkLENBSG9CLENBSXBCOztBQUNBLFVBQUlILE1BQU0sSUFBSTNDLEtBQUssQ0FBQzFFLEdBQU4sS0FBY3lILGNBQUlDLENBQWhDLEVBQW1DO0FBQy9CLGFBQUtDLGVBQUwsQ0FBcUIsTUFBckI7O0FBQ0FILFFBQUFBLE9BQU8sR0FBRyxJQUFWLENBRitCLENBR25DO0FBQ0MsT0FKRCxNQUlPLElBQUlILE1BQU0sSUFBSTNDLEtBQUssQ0FBQzFFLEdBQU4sS0FBY3lILGNBQUlHLENBQWhDLEVBQW1DO0FBQ3RDLGFBQUtELGVBQUwsQ0FBcUIsU0FBckI7O0FBQ0FILFFBQUFBLE9BQU8sR0FBRyxJQUFWLENBRnNDLENBRzFDO0FBQ0MsT0FKTSxNQUlBLElBQUlILE1BQU0sSUFBSTNDLEtBQUssQ0FBQzFFLEdBQU4sS0FBY3lILGNBQUlJLFlBQWhDLEVBQThDO0FBQ2pELGFBQUtGLGVBQUwsQ0FBcUIsT0FBckI7O0FBQ0FILFFBQUFBLE9BQU8sR0FBRyxJQUFWLENBRmlELENBR3JEO0FBQ0MsT0FKTSxNQUlBLElBQUssQ0FBQzdILE1BQUQsSUFBVzBILE1BQVgsSUFBcUIzQyxLQUFLLENBQUMxRSxHQUFOLEtBQWN5SCxjQUFJSyxDQUF4QyxJQUNBbkksTUFBTSxJQUFJMEgsTUFBVixJQUFvQjNDLEtBQUssQ0FBQ3FELFFBQTFCLElBQXNDckQsS0FBSyxDQUFDMUUsR0FBTixLQUFjeUgsY0FBSU8sQ0FENUQsRUFDZ0U7QUFDbkUsWUFBSSxLQUFLckUsY0FBTCxDQUFvQnNFLE9BQXBCLEVBQUosRUFBbUM7QUFDL0IsZ0JBQU07QUFBQ3BHLFlBQUFBLEtBQUQ7QUFBUTRFLFlBQUFBO0FBQVIsY0FBaUIsS0FBSzlDLGNBQUwsQ0FBb0J1RSxJQUFwQixFQUF2QixDQUQrQixDQUUvQjtBQUNBOztBQUNBN0csVUFBQUEsS0FBSyxDQUFDOEcsS0FBTixDQUFZdEcsS0FBWixFQUFtQjRFLEtBQW5CLEVBQTBCLGFBQTFCO0FBQ0g7O0FBQ0RlLFFBQUFBLE9BQU8sR0FBRyxJQUFWLENBUG1FLENBUXZFO0FBQ0MsT0FWTSxNQVVBLElBQUlILE1BQU0sSUFBSTNDLEtBQUssQ0FBQzFFLEdBQU4sS0FBY3lILGNBQUlPLENBQWhDLEVBQW1DO0FBQ3RDLFlBQUksS0FBS3JFLGNBQUwsQ0FBb0J5RSxPQUFwQixFQUFKLEVBQW1DO0FBQy9CLGdCQUFNO0FBQUN2RyxZQUFBQSxLQUFEO0FBQVE0RSxZQUFBQTtBQUFSLGNBQWlCLEtBQUs5QyxjQUFMLENBQW9CMEUsSUFBcEIsQ0FBeUIsS0FBS3BILEtBQUwsQ0FBV0ksS0FBcEMsQ0FBdkIsQ0FEK0IsQ0FFL0I7QUFDQTs7QUFDQUEsVUFBQUEsS0FBSyxDQUFDOEcsS0FBTixDQUFZdEcsS0FBWixFQUFtQjRFLEtBQW5CLEVBQTBCLGFBQTFCO0FBQ0g7O0FBQ0RlLFFBQUFBLE9BQU8sR0FBRyxJQUFWLENBUHNDLENBUTFDO0FBQ0MsT0FUTSxNQVNBLElBQUk5QyxLQUFLLENBQUMxRSxHQUFOLEtBQWN5SCxjQUFJYSxLQUFsQixLQUE0QjVELEtBQUssQ0FBQ3FELFFBQU4sSUFBbUJwSSxNQUFNLElBQUkrRSxLQUFLLENBQUM2RCxNQUEvRCxDQUFKLEVBQTZFO0FBQ2hGLGFBQUtDLFdBQUwsQ0FBaUIsSUFBakI7O0FBQ0FoQixRQUFBQSxPQUFPLEdBQUcsSUFBVixDQUZnRixDQUdwRjtBQUNDLE9BSk0sTUFJQSxJQUFJSCxNQUFNLElBQUkzQyxLQUFLLENBQUMxRSxHQUFOLEtBQWN5SCxjQUFJZ0IsSUFBNUIsSUFBb0MsQ0FBQy9ELEtBQUssQ0FBQ3FELFFBQS9DLEVBQXlEO0FBQzVELGlDQUFhLEtBQUtuRixVQUFsQixFQUE4QnZCLEtBQTlCLEVBQXFDO0FBQ2pDSyxVQUFBQSxLQUFLLEVBQUUsQ0FEMEI7QUFFakNDLFVBQUFBLE1BQU0sRUFBRTtBQUZ5QixTQUFyQztBQUlBNkYsUUFBQUEsT0FBTyxHQUFHLElBQVYsQ0FMNEQsQ0FNaEU7QUFDQyxPQVBNLE1BT0EsSUFBSUgsTUFBTSxJQUFJM0MsS0FBSyxDQUFDMUUsR0FBTixLQUFjeUgsY0FBSWlCLEdBQTVCLElBQW1DLENBQUNoRSxLQUFLLENBQUNxRCxRQUE5QyxFQUF3RDtBQUMzRCxpQ0FBYSxLQUFLbkYsVUFBbEIsRUFBOEJ2QixLQUE5QixFQUFxQztBQUNqQ0ssVUFBQUEsS0FBSyxFQUFFTCxLQUFLLENBQUNRLEtBQU4sQ0FBWThHLE1BQVosR0FBcUIsQ0FESztBQUVqQ2hILFVBQUFBLE1BQU0sRUFBRU4sS0FBSyxDQUFDUSxLQUFOLENBQVlSLEtBQUssQ0FBQ1EsS0FBTixDQUFZOEcsTUFBWixHQUFxQixDQUFqQyxFQUFvQzNHLElBQXBDLENBQXlDMkc7QUFGaEIsU0FBckM7QUFJQW5CLFFBQUFBLE9BQU8sR0FBRyxJQUFWLENBTDJELENBTS9EO0FBQ0MsT0FQTSxNQU9BO0FBQ0gsY0FBTW9CLGdCQUFnQixHQUFHbEUsS0FBSyxDQUFDNEMsT0FBTixJQUFpQjVDLEtBQUssQ0FBQzZELE1BQWhEO0FBQ0EsY0FBTU0sZUFBZSxHQUFHRCxnQkFBZ0IsSUFBSWxFLEtBQUssQ0FBQ3FELFFBQWxEOztBQUNBLFlBQUkxRyxLQUFLLENBQUNxQyxZQUFOLElBQXNCckMsS0FBSyxDQUFDcUMsWUFBTixDQUFtQm9GLGNBQW5CLEVBQTFCLEVBQStEO0FBQzNELGdCQUFNcEYsWUFBWSxHQUFHckMsS0FBSyxDQUFDcUMsWUFBM0I7O0FBQ0Esa0JBQVFnQixLQUFLLENBQUMxRSxHQUFkO0FBQ0ksaUJBQUt5SCxjQUFJc0IsUUFBVDtBQUNJLGtCQUFJLENBQUNGLGVBQUwsRUFBc0I7QUFDbEJuRixnQkFBQUEsWUFBWSxDQUFDc0YsU0FBYixDQUF1QnRFLEtBQXZCO0FBQ0E4QyxnQkFBQUEsT0FBTyxHQUFHLElBQVY7QUFDSDs7QUFDRDs7QUFDSixpQkFBS0MsY0FBSXdCLFVBQVQ7QUFDSSxrQkFBSSxDQUFDSixlQUFMLEVBQXNCO0FBQ2xCbkYsZ0JBQUFBLFlBQVksQ0FBQ3dGLFdBQWIsQ0FBeUJ4RSxLQUF6QjtBQUNBOEMsZ0JBQUFBLE9BQU8sR0FBRyxJQUFWO0FBQ0g7O0FBQ0Q7O0FBQ0osaUJBQUtDLGNBQUkwQixHQUFUO0FBQ0ksa0JBQUksQ0FBQ1AsZ0JBQUwsRUFBdUI7QUFDbkJsRixnQkFBQUEsWUFBWSxDQUFDMEYsS0FBYixDQUFtQjFFLEtBQW5CO0FBQ0E4QyxnQkFBQUEsT0FBTyxHQUFHLElBQVY7QUFDSDs7QUFDRDs7QUFDSixpQkFBS0MsY0FBSTRCLE1BQVQ7QUFDSSxrQkFBSSxDQUFDUixlQUFMLEVBQXNCO0FBQ2xCbkYsZ0JBQUFBLFlBQVksQ0FBQzRGLFFBQWIsQ0FBc0I1RSxLQUF0QjtBQUNBOEMsZ0JBQUFBLE9BQU8sR0FBRyxJQUFWO0FBQ0g7O0FBQ0Q7O0FBQ0o7QUFDSTtBQUFRO0FBMUJoQjtBQTRCSCxTQTlCRCxNQThCTyxJQUFJOUMsS0FBSyxDQUFDMUUsR0FBTixLQUFjeUgsY0FBSTBCLEdBQXRCLEVBQTJCO0FBQzlCLGVBQUtJLGdCQUFMOztBQUNBL0IsVUFBQUEsT0FBTyxHQUFHLElBQVY7QUFDSCxTQUhNLE1BR0EsSUFBSTlDLEtBQUssQ0FBQzFFLEdBQU4sS0FBY3lILGNBQUkrQixTQUFsQixJQUErQjlFLEtBQUssQ0FBQzFFLEdBQU4sS0FBY3lILGNBQUlnQyxNQUFyRCxFQUE2RDtBQUNoRSxlQUFLbEcsYUFBTCxDQUFtQkMsSUFBbkI7QUFDSDtBQUNKOztBQUNELFVBQUlnRSxPQUFKLEVBQWE7QUFDVDlDLFFBQUFBLEtBQUssQ0FBQ3NCLGNBQU47QUFDQXRCLFFBQUFBLEtBQUssQ0FBQ2dGLGVBQU47QUFDSDtBQUNKLEtBbFlrQjtBQUFBLGtFQThhT0MsVUFBRCxJQUFnQjtBQUNyQyxXQUFLMUksS0FBTCxDQUFXSSxLQUFYLENBQWlCcUMsWUFBakIsQ0FBOEJrRyxrQkFBOUIsQ0FBaURELFVBQWpEO0FBQ0gsS0FoYmtCO0FBQUEsMEVBa2JjLENBQUNBLFVBQUQsRUFBYUUsZUFBYixLQUFpQztBQUM5RCxXQUFLNUksS0FBTCxDQUFXSSxLQUFYLENBQWlCcUMsWUFBakIsQ0FBOEJvRywwQkFBOUIsQ0FBeURILFVBQXpEO0FBQ0EsV0FBS2xHLFFBQUwsQ0FBYztBQUFDb0csUUFBQUE7QUFBRCxPQUFkO0FBQ0gsS0FyYmtCO0FBQUEseUVBdWJhLE1BQU07QUFDbEMsWUFBTUUsYUFBYSxHQUFHQyx1QkFBY0MsUUFBZCxDQUF1Qix1Q0FBdkIsQ0FBdEI7O0FBQ0EsV0FBS2hKLEtBQUwsQ0FBV0ksS0FBWCxDQUFpQjZJLG9CQUFqQixDQUFzQ0gsYUFBYSxHQUFHLEtBQUtJLGdCQUFSLEdBQTJCLElBQTlFO0FBQ0gsS0ExYmtCO0FBQUEsMEVBNGJjLE1BQU07QUFDbkMsWUFBTUMsY0FBYyxHQUFHSix1QkFBY0MsUUFBZCxDQUF1QiwyQkFBdkIsQ0FBdkI7O0FBQ0EsV0FBS3hHLFFBQUwsQ0FBYztBQUFFMkcsUUFBQUE7QUFBRixPQUFkO0FBQ0gsS0EvYmtCO0FBQUEsMkRBa2ZBQyxNQUFELElBQVk7QUFDMUIsWUFBTS9JLEtBQUssR0FBRywrQkFDVixLQUFLc0IsVUFESyxFQUVWLEtBQUszQixLQUFMLENBQVdJLEtBRkQsRUFHVitELFFBQVEsQ0FBQ0MsWUFBVCxFQUhVLENBQWQ7O0FBSUEsVUFBSS9ELEtBQUssQ0FBQ3FILE1BQU4sS0FBaUIsQ0FBckIsRUFBd0I7QUFDcEI7QUFDSDs7QUFDRCxXQUFLaEYsY0FBTCxDQUFvQjJHLHVCQUFwQixDQUE0QyxLQUFLckosS0FBTCxDQUFXSSxLQUF2RDtBQUNBLFdBQUswRSxhQUFMLEdBQXFCLElBQXJCOztBQUNBLGNBQVFzRSxNQUFSO0FBQ0ksYUFBSyxNQUFMO0FBQ0ksOENBQW1CL0ksS0FBbkIsRUFBMEIsSUFBMUI7QUFDQTs7QUFDSixhQUFLLFNBQUw7QUFDSSw4Q0FBbUJBLEtBQW5CLEVBQTBCLEdBQTFCO0FBQ0E7O0FBQ0osYUFBSyxlQUFMO0FBQ0ksOENBQW1CQSxLQUFuQixFQUEwQixPQUExQixFQUFtQyxRQUFuQztBQUNBOztBQUNKLGFBQUssTUFBTDtBQUNJLDZDQUFrQkEsS0FBbEI7QUFDQTs7QUFDSixhQUFLLE9BQUw7QUFDSSw4Q0FBbUJBLEtBQW5CO0FBQ0E7QUFmUjtBQWlCSCxLQTdnQmtCO0FBRWYsU0FBS2lKLEtBQUwsR0FBYTtBQUNUN0csTUFBQUEsWUFBWSxFQUFFLElBREw7QUFFVDBHLE1BQUFBLGNBQWMsRUFBRUosdUJBQWNDLFFBQWQsQ0FBdUIsMkJBQXZCO0FBRlAsS0FBYjtBQUlBLFNBQUtySCxVQUFMLEdBQWtCLElBQWxCO0FBQ0EsU0FBSzRILGdCQUFMLEdBQXdCLElBQXhCO0FBQ0EsU0FBS2pILGFBQUwsR0FBcUIsSUFBckI7QUFDQSxTQUFLd0MsYUFBTCxHQUFxQixLQUFyQjtBQUNBLFNBQUtwQixlQUFMLEdBQXVCLEtBQXZCO0FBQ0EsU0FBS3FDLGdCQUFMLEdBQXdCLEtBQXhCO0FBQ0EsU0FBS3lELHNCQUFMLEdBQThCLElBQTlCO0FBQ0EsU0FBS0Msa0NBQUwsR0FBMEMsSUFBMUM7QUFDSDs7QUFFREMsRUFBQUEsa0JBQWtCLENBQUNDLFNBQUQsRUFBWTtBQUMxQixRQUFJLEtBQUszSixLQUFMLENBQVdtQyxXQUFYLEtBQTJCd0gsU0FBUyxDQUFDeEgsV0FBckMsSUFBb0QsS0FBS25DLEtBQUwsQ0FBV21DLFdBQW5FLEVBQWdGO0FBQzVFLFlBQU07QUFBQ0QsUUFBQUE7QUFBRCxVQUFZLEtBQUtsQyxLQUFMLENBQVdJLEtBQTdCOztBQUNBLFVBQUk4QixPQUFKLEVBQWE7QUFDVCxhQUFLRSxnQkFBTDtBQUNILE9BRkQsTUFFTztBQUNILGFBQUtDLGdCQUFMO0FBQ0g7QUFDSjtBQUNKOztBQTJFREQsRUFBQUEsZ0JBQWdCLEdBQUc7QUFDZixTQUFLVCxVQUFMLENBQWdCaUksS0FBaEIsQ0FBc0JDLFdBQXRCLENBQWtDLGVBQWxDLGFBQXVELEtBQUs3SixLQUFMLENBQVdtQyxXQUFsRTs7QUFDQSxTQUFLUixVQUFMLENBQWdCbUksU0FBaEIsQ0FBMEJDLEdBQTFCLENBQThCLG9DQUE5QjtBQUNIOztBQUVEMUgsRUFBQUEsZ0JBQWdCLEdBQUc7QUFDZixTQUFLVixVQUFMLENBQWdCbUksU0FBaEIsQ0FBMEJFLE1BQTFCLENBQWlDLG9DQUFqQzs7QUFDQSxTQUFLckksVUFBTCxDQUFnQmlJLEtBQWhCLENBQXNCSyxjQUF0QixDQUFxQyxlQUFyQztBQUNIOztBQStCREMsRUFBQUEsV0FBVyxDQUFDekcsS0FBRCxFQUFRO0FBQ2Y7QUFDQTtBQUNBO0FBQ0EsV0FBTyxDQUFDLEVBQUUsS0FBS0MsZUFBTCxJQUF5QkQsS0FBSyxDQUFDMEcsV0FBTixJQUFxQjFHLEtBQUssQ0FBQzBHLFdBQU4sQ0FBa0JELFdBQWxFLENBQVI7QUFDSDs7QUEwREQzQyxFQUFBQSxXQUFXLENBQUM2QyxZQUFELEVBQWVsSyxTQUFTLEdBQUcsWUFBM0IsRUFBeUM7QUFDaEQsVUFBTXFGLEdBQUcsR0FBR3BCLFFBQVEsQ0FBQ0MsWUFBVCxFQUFaO0FBQ0EsVUFBTTtBQUFDb0IsTUFBQUEsS0FBRDtBQUFRekUsTUFBQUE7QUFBUixRQUFnQixnQ0FBc0IsS0FBS1ksVUFBM0IsRUFBdUM0RCxHQUF2QyxDQUF0QjtBQUNBLFVBQU04RSxPQUFPLEdBQUd0SixJQUFJLENBQUN1SixNQUFMLENBQVksQ0FBWixFQUFlOUUsS0FBSyxDQUFDOUUsTUFBckIsSUFBK0IwSixZQUEvQixHQUE4Q3JKLElBQUksQ0FBQ3VKLE1BQUwsQ0FBWTlFLEtBQUssQ0FBQzlFLE1BQWxCLENBQTlEO0FBQ0E4RSxJQUFBQSxLQUFLLENBQUM5RSxNQUFOLElBQWdCMEosWUFBWSxDQUFDMUMsTUFBN0I7QUFDQSxTQUFLNUMsYUFBTCxHQUFxQixJQUFyQjtBQUNBLFNBQUs5RSxLQUFMLENBQVdJLEtBQVgsQ0FBaUJxRixNQUFqQixDQUF3QjRFLE9BQXhCLEVBQWlDbkssU0FBakMsRUFBNENzRixLQUE1QztBQUNILEdBM04yRCxDQTZONUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBQ0F2RCxFQUFBQSx5QkFBeUIsQ0FBQ0YsUUFBRCxFQUFXO0FBQ2hDLFVBQU07QUFBQzNCLE1BQUFBO0FBQUQsUUFBVSxLQUFLSixLQUFyQjtBQUNBLFNBQUt1SyxhQUFMLEdBQXFCeEksUUFBUSxDQUFDeUksT0FBVCxDQUFpQnBLLEtBQWpCLENBQXJCO0FBQ0EsU0FBS3FLLFVBQUwsR0FBa0IxSSxRQUFRLENBQUMySSxRQUFULENBQWtCdEssS0FBbEIsQ0FBbEI7QUFDQSxTQUFLeUYsY0FBTCxHQUFzQjdHLGNBQWMsQ0FBQ21GLFFBQVEsQ0FBQ0MsWUFBVCxFQUFELENBQXBDO0FBQ0g7O0FBRUQwQixFQUFBQSx5QkFBeUIsR0FBRztBQUN4QjtBQUNBO0FBQ0E7QUFDQSxRQUFJLENBQUMsS0FBS25FLFVBQVYsRUFBc0I7QUFDbEI7QUFDSDs7QUFDRCxVQUFNMUMsU0FBUyxHQUFHa0YsUUFBUSxDQUFDQyxZQUFULEVBQWxCOztBQUNBLFFBQUksQ0FBQyxLQUFLeUIsY0FBTixJQUF3QixDQUFDcEcsZUFBZSxDQUFDLEtBQUtvRyxjQUFOLEVBQXNCNUcsU0FBdEIsQ0FBNUMsRUFBOEU7QUFDMUUsV0FBSzRHLGNBQUwsR0FBc0I3RyxjQUFjLENBQUNDLFNBQUQsQ0FBcEM7QUFDQSxZQUFNO0FBQUN1RyxRQUFBQSxLQUFEO0FBQVF6RSxRQUFBQTtBQUFSLFVBQWdCLGdDQUFzQixLQUFLWSxVQUEzQixFQUF1QzFDLFNBQXZDLENBQXRCO0FBQ0EsV0FBS3dMLFVBQUwsR0FBa0JqRixLQUFsQjtBQUNBLFdBQUsrRSxhQUFMLEdBQXFCL0UsS0FBSyxDQUFDOUUsTUFBTixLQUFpQkssSUFBSSxDQUFDMkcsTUFBM0M7QUFDSDs7QUFDRCxXQUFPLEtBQUsrQyxVQUFaO0FBQ0g7O0FBRURFLEVBQUFBLGdCQUFnQixHQUFHO0FBQ2YsU0FBS2pJLGNBQUwsQ0FBb0JrSSxLQUFwQjtBQUNIOztBQUVEQyxFQUFBQSxRQUFRLEdBQUc7QUFDUCxXQUFPLEtBQUtKLFVBQVo7QUFDSDs7QUFFREssRUFBQUEsb0JBQW9CLEdBQUc7QUFDbkIsV0FBTyxDQUFDLEtBQUtqRixjQUFOLElBQXdCLEtBQUtBLGNBQUwsQ0FBb0J2RyxXQUFuRDtBQUNIOztBQUVEeUwsRUFBQUEsY0FBYyxHQUFHO0FBQ2IsV0FBTyxLQUFLRixRQUFMLEdBQWdCbkssTUFBaEIsS0FBMkIsQ0FBbEM7QUFDSDs7QUFFRHNLLEVBQUFBLFlBQVksR0FBRztBQUNYLFdBQU8sS0FBS1QsYUFBWjtBQUNIOztBQWtJRCxRQUFNakMsZ0JBQU4sR0FBeUI7QUFDckIsUUFBSTtBQUNBLFlBQU0sSUFBSXRFLE9BQUosQ0FBWUMsT0FBTyxJQUFJLEtBQUt6QixRQUFMLENBQWM7QUFBQ3lJLFFBQUFBLGNBQWMsRUFBRTtBQUFqQixPQUFkLEVBQXVDaEgsT0FBdkMsQ0FBdkIsQ0FBTjtBQUNBLFlBQU07QUFBQzdELFFBQUFBO0FBQUQsVUFBVSxLQUFLSixLQUFyQjtBQUNBLFlBQU13RixLQUFLLEdBQUcsS0FBS3FGLFFBQUwsRUFBZDtBQUNBLFlBQU05SSxRQUFRLEdBQUczQixLQUFLLENBQUM4SyxpQkFBTixDQUF3QjFGLEtBQUssQ0FBQzlFLE1BQTlCLEVBQXNDOEUsS0FBSyxDQUFDMkYsU0FBNUMsQ0FBakI7QUFDQSxZQUFNOUssS0FBSyxHQUFHRCxLQUFLLENBQUNFLFVBQU4sQ0FBaUJ5QixRQUFqQixDQUFkO0FBQ0ExQixNQUFBQSxLQUFLLENBQUNHLG9CQUFOLENBQTJCLENBQUNDLEtBQUQsRUFBUUMsTUFBUixFQUFnQkMsSUFBaEIsS0FBeUI7QUFDaEQsZUFBT0EsSUFBSSxDQUFDSSxJQUFMLENBQVVMLE1BQVYsTUFBc0IsR0FBdEIsS0FDSEMsSUFBSSxDQUFDbkIsSUFBTCxLQUFjLE9BQWQsSUFDQW1CLElBQUksQ0FBQ25CLElBQUwsS0FBYyxnQkFEZCxJQUVBbUIsSUFBSSxDQUFDbkIsSUFBTCxLQUFjLFNBSFgsQ0FBUDtBQUtILE9BTkQ7QUFPQSxZQUFNO0FBQUM4QixRQUFBQTtBQUFELFVBQWdCbEIsS0FBdEIsQ0FiQSxDQWNBOztBQUNBLFlBQU1BLEtBQUssQ0FBQ2dMLFNBQU4sQ0FBZ0IsTUFBTTtBQUN4QixjQUFNQyxRQUFRLEdBQUdoTCxLQUFLLENBQUNZLE9BQU4sQ0FBYyxDQUFDSyxXQUFXLENBQUNnSyxhQUFaLENBQTBCakwsS0FBSyxDQUFDVSxJQUFoQyxDQUFELENBQWQsQ0FBakI7QUFDQSxlQUFPWCxLQUFLLENBQUM4SyxpQkFBTixDQUF3QjFGLEtBQUssQ0FBQzlFLE1BQU4sR0FBZTJLLFFBQXZDLEVBQWlELElBQWpELENBQVA7QUFDSCxPQUhLLENBQU4sQ0FmQSxDQW9CQTs7QUFDQSxVQUFJakwsS0FBSyxDQUFDcUMsWUFBVixFQUF3QjtBQUNwQixjQUFNckMsS0FBSyxDQUFDcUMsWUFBTixDQUFtQjBGLEtBQW5CLEVBQU47O0FBQ0EsWUFBSSxDQUFDL0gsS0FBSyxDQUFDcUMsWUFBTixDQUFtQjhJLFlBQW5CLEVBQUwsRUFBd0M7QUFDcEMsZUFBSy9JLFFBQUwsQ0FBYztBQUFDeUksWUFBQUEsY0FBYyxFQUFFO0FBQWpCLFdBQWQ7QUFDQTdLLFVBQUFBLEtBQUssQ0FBQ3FDLFlBQU4sQ0FBbUIrSSxLQUFuQjtBQUNIO0FBQ0o7QUFDSixLQTVCRCxDQTRCRSxPQUFPNUosR0FBUCxFQUFZO0FBQ1ZDLE1BQUFBLE9BQU8sQ0FBQ0MsS0FBUixDQUFjRixHQUFkO0FBQ0g7QUFDSjs7QUFFRDZKLEVBQUFBLG1CQUFtQixHQUFHO0FBQ2xCLFdBQU8sS0FBSzlKLFVBQVo7QUFDSDs7QUFFRCtKLEVBQUFBLFVBQVUsR0FBRztBQUNULFdBQU8sS0FBSzVHLGFBQVo7QUFDSDs7QUFxQkQ2RyxFQUFBQSxvQkFBb0IsR0FBRztBQUNuQnhILElBQUFBLFFBQVEsQ0FBQ3VCLG1CQUFULENBQTZCLGlCQUE3QixFQUFnRCxLQUFLQyxrQkFBckQ7O0FBQ0EsU0FBS2hFLFVBQUwsQ0FBZ0IrRCxtQkFBaEIsQ0FBb0MsT0FBcEMsRUFBNkMsS0FBSzNCLFFBQWxELEVBQTRELElBQTVEOztBQUNBLFNBQUtwQyxVQUFMLENBQWdCK0QsbUJBQWhCLENBQW9DLGtCQUFwQyxFQUF3RCxLQUFLa0csbUJBQTdELEVBQWtGLElBQWxGOztBQUNBLFNBQUtqSyxVQUFMLENBQWdCK0QsbUJBQWhCLENBQW9DLGdCQUFwQyxFQUFzRCxLQUFLbUcsaUJBQTNELEVBQThFLElBQTlFOztBQUNBOUMsMkJBQWMrQyxjQUFkLENBQTZCLEtBQUt0QyxzQkFBbEM7O0FBQ0FULDJCQUFjK0MsY0FBZCxDQUE2QixLQUFLckMsa0NBQWxDO0FBQ0g7O0FBRURzQyxFQUFBQSxpQkFBaUIsR0FBRztBQUNoQixVQUFNM0wsS0FBSyxHQUFHLEtBQUtKLEtBQUwsQ0FBV0ksS0FBekI7QUFDQUEsSUFBQUEsS0FBSyxDQUFDNEwsaUJBQU4sQ0FBd0IsS0FBS0Msa0JBQTdCO0FBQ0EsU0FBS3pDLHNCQUFMLEdBQThCVCx1QkFBY21ELFlBQWQsQ0FBMkIsdUNBQTNCLEVBQW9FLElBQXBFLEVBQzFCLEtBQUtDLDZCQURxQixDQUE5Qjs7QUFFQSxTQUFLQSw2QkFBTDs7QUFDQSxTQUFLMUMsa0NBQUwsR0FBMENWLHVCQUFjbUQsWUFBZCxDQUEyQiwyQkFBM0IsRUFBd0QsSUFBeEQsRUFDdEMsS0FBS0UsOEJBRGlDLENBQTFDO0FBRUEsVUFBTTlLLFdBQVcsR0FBR2xCLEtBQUssQ0FBQ2tCLFdBQTFCLENBUmdCLENBU2hCO0FBQ0E7O0FBQ0FBLElBQUFBLFdBQVcsQ0FBQytLLHNCQUFaLENBQW1DLGdDQUMvQixNQUFNLEtBQUs5QyxnQkFEb0IsRUFFL0J2SSxLQUFLLElBQUksSUFBSWdELE9BQUosQ0FBWUMsT0FBTyxJQUFJLEtBQUt6QixRQUFMLENBQWM7QUFBQ3hCLE1BQUFBO0FBQUQsS0FBZCxFQUF1QmlELE9BQXZCLENBQXZCLENBRnNCLENBQW5DO0FBSUEsU0FBS3ZCLGNBQUwsR0FBc0IsSUFBSTRKLGdCQUFKLENBQW1CaEwsV0FBbkIsQ0FBdEIsQ0FmZ0IsQ0FnQmhCOztBQUNBLFNBQUsySyxrQkFBTCxDQUF3QixLQUFLTSx3QkFBTCxFQUF4QixFQWpCZ0IsQ0FrQmhCO0FBQ0E7OztBQUNBLFNBQUs1SyxVQUFMLENBQWdCaUUsZ0JBQWhCLENBQWlDLE9BQWpDLEVBQTBDLEtBQUs3QixRQUEvQyxFQUF5RCxJQUF6RDs7QUFDQSxTQUFLcEMsVUFBTCxDQUFnQmlFLGdCQUFoQixDQUFpQyxrQkFBakMsRUFBcUQsS0FBS2dHLG1CQUExRCxFQUErRSxJQUEvRTs7QUFDQSxTQUFLakssVUFBTCxDQUFnQmlFLGdCQUFoQixDQUFpQyxnQkFBakMsRUFBbUQsS0FBS2lHLGlCQUF4RCxFQUEyRSxJQUEzRTs7QUFDQSxTQUFLbEssVUFBTCxDQUFnQjZLLEtBQWhCO0FBQ0g7O0FBRURELEVBQUFBLHdCQUF3QixHQUFHO0FBQ3ZCLFFBQUl0TSxhQUFKOztBQUNBLFFBQUksS0FBS0QsS0FBTCxDQUFXeU0sWUFBZixFQUE2QjtBQUN6QjtBQUNBO0FBQ0EsWUFBTWpILEtBQUssR0FBRyxLQUFLeEYsS0FBTCxDQUFXeU0sWUFBekI7QUFDQXhNLE1BQUFBLGFBQWEsR0FBRyxLQUFLRCxLQUFMLENBQVdJLEtBQVgsQ0FBaUI4SyxpQkFBakIsQ0FBbUMxRixLQUFLLENBQUM5RSxNQUF6QyxFQUFpRDhFLEtBQUssQ0FBQzJGLFNBQXZELENBQWhCO0FBQ0gsS0FMRCxNQUtPO0FBQ0g7QUFDQWxMLE1BQUFBLGFBQWEsR0FBRyxLQUFLRCxLQUFMLENBQVdJLEtBQVgsQ0FBaUJzTSxnQkFBakIsRUFBaEI7QUFDSDs7QUFDRCxXQUFPek0sYUFBUDtBQUNIOztBQStCRDBNLEVBQUFBLE1BQU0sR0FBRztBQUNMLFFBQUlsSyxZQUFKOztBQUNBLFFBQUksS0FBSzZHLEtBQUwsQ0FBVzdHLFlBQWYsRUFBNkI7QUFDekIsWUFBTXpCLEtBQUssR0FBRyxLQUFLc0ksS0FBTCxDQUFXdEksS0FBekI7QUFDQSxZQUFNNEwsUUFBUSxHQUFHNUwsS0FBSyxDQUFDMEcsTUFBdkI7QUFDQWpGLE1BQUFBLFlBQVksZ0JBQUk7QUFBSyxRQUFBLFNBQVMsRUFBQztBQUFmLHNCQUNaLDZCQUFDLHFCQUFEO0FBQ0ksUUFBQSxHQUFHLEVBQUVvSyxHQUFHLElBQUksS0FBS3RELGdCQUFMLEdBQXdCc0QsR0FEeEM7QUFFSSxRQUFBLEtBQUssRUFBRTdMLEtBRlg7QUFHSSxRQUFBLFNBQVMsRUFBRSxLQUFLOEwsc0JBSHBCO0FBSUksUUFBQSxpQkFBaUIsRUFBRSxLQUFLQyw4QkFKNUI7QUFLSSxRQUFBLFNBQVMsRUFBRTtBQUFDQyxVQUFBQSxTQUFTLEVBQUUsSUFBWjtBQUFrQmhMLFVBQUFBLEdBQUcsRUFBRTRLLFFBQXZCO0FBQWlDSyxVQUFBQSxLQUFLLEVBQUVMO0FBQXhDLFNBTGY7QUFNSSxRQUFBLElBQUksRUFBRSxLQUFLNU0sS0FBTCxDQUFXc0Q7QUFOckIsUUFEWSxDQUFoQjtBQVVIOztBQUNELFVBQU00SixjQUFjLEdBQUcseUJBQVcseUJBQVgsRUFBc0M7QUFDekQsNkNBQXVDLEtBQUs1RCxLQUFMLENBQVcyQjtBQURPLEtBQXRDLENBQXZCO0FBR0EsVUFBTWtDLE9BQU8sR0FBRyx5QkFBVywrQkFBWCxFQUE0QztBQUN4RCw0REFBc0QsS0FBSzdELEtBQUwsQ0FBV0g7QUFEVCxLQUE1QyxDQUFoQjtBQUlBLFVBQU1pRSx3QkFBd0IsR0FBR0MsR0FBRyxDQUFDQyxZQUFKLENBQWlCLGdDQUFqQixDQUFqQztBQUNBLFVBQU1DLFNBQVMsR0FBRztBQUNkQyxNQUFBQSxJQUFJLEVBQUUxTyxpQkFBaUIsQ0FBQyxHQUFELENBRFQ7QUFFZDJPLE1BQUFBLE9BQU8sRUFBRTNPLGlCQUFpQixDQUFDLEdBQUQsQ0FGWjtBQUdkNE8sTUFBQUEsS0FBSyxFQUFFNU8saUJBQWlCLENBQUMsR0FBRDtBQUhWLEtBQWxCO0FBTUEsVUFBTTtBQUFDOEosTUFBQUE7QUFBRCxRQUFvQixLQUFLVSxLQUEvQjtBQUVBLHdCQUFRO0FBQUssTUFBQSxTQUFTLEVBQUU0RDtBQUFoQixPQUNGekssWUFERSxlQUVKLDZCQUFDLHdCQUFEO0FBQTBCLE1BQUEsR0FBRyxFQUFFb0ssR0FBRyxJQUFJLEtBQUt2SyxhQUFMLEdBQXFCdUssR0FBM0Q7QUFBZ0UsTUFBQSxRQUFRLEVBQUUsS0FBS25HLGVBQS9FO0FBQWdHLE1BQUEsU0FBUyxFQUFFNkc7QUFBM0csTUFGSSxlQUdKO0FBQ0ksTUFBQSxTQUFTLEVBQUVKLE9BRGY7QUFFSSxNQUFBLGVBQWUsRUFBQyxNQUZwQjtBQUdJLE1BQUEsUUFBUSxFQUFDLEdBSGI7QUFJSSxNQUFBLE1BQU0sRUFBRSxLQUFLUSxPQUpqQjtBQUtJLE1BQUEsT0FBTyxFQUFFLEtBQUtDLFFBTGxCO0FBTUksTUFBQSxNQUFNLEVBQUUsS0FBS0MsT0FOakI7QUFPSSxNQUFBLEtBQUssRUFBRSxLQUFLQyxNQVBoQjtBQVFJLE1BQUEsT0FBTyxFQUFFLEtBQUtDLFFBUmxCO0FBU0ksTUFBQSxTQUFTLEVBQUUsS0FBS0MsVUFUcEI7QUFVSSxNQUFBLEdBQUcsRUFBRW5CLEdBQUcsSUFBSSxLQUFLbEwsVUFBTCxHQUFrQmtMLEdBVmxDO0FBV0ksb0JBQVksS0FBSzdNLEtBQUwsQ0FBV2lPLEtBWDNCO0FBWUksTUFBQSxJQUFJLEVBQUMsU0FaVDtBQWFJLHdCQUFlLE1BYm5CO0FBY0ksMkJBQWtCLE1BZHRCO0FBZUksdUJBQWMsU0FmbEI7QUFnQkksdUJBQWVDLE9BQU8sQ0FBQyxLQUFLNUUsS0FBTCxDQUFXN0csWUFBWixDQWhCMUI7QUFpQkksK0JBQXVCbUcsZUFBZSxJQUFJLENBQW5CLEdBQXVCLDJDQUF3QkEsZUFBeEIsQ0FBdkIsR0FBa0V1RixTQWpCN0Y7QUFrQkksTUFBQSxHQUFHLEVBQUM7QUFsQlIsTUFISSxDQUFSO0FBd0JIOztBQUVEM0IsRUFBQUEsS0FBSyxHQUFHO0FBQ0osU0FBSzdLLFVBQUwsQ0FBZ0I2SyxLQUFoQjtBQUNIOztBQXJsQjJEOzs7OEJBQTNDNU0sa0IsZUFDRTtBQUNmNEQsRUFBQUEsUUFBUSxFQUFFNEssbUJBQVVDLElBREw7QUFFZmpPLEVBQUFBLEtBQUssRUFBRWdPLG1CQUFVRSxVQUFWLENBQXFCQyxjQUFyQixFQUFrQ0MsVUFGMUI7QUFHZmxMLEVBQUFBLElBQUksRUFBRThLLG1CQUFVRSxVQUFWLENBQXFCRyxpQkFBckIsRUFBMkJELFVBSGxCO0FBSWZyTSxFQUFBQSxXQUFXLEVBQUVpTSxtQkFBVU0sTUFKUjtBQUtmVCxFQUFBQSxLQUFLLEVBQUVHLG1CQUFVTSxNQUxGO0FBS2E7QUFDNUJqQyxFQUFBQSxZQUFZLEVBQUUyQixtQkFBVU8sTUFOVCxDQU1pQjs7QUFOakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IEVkaXRvck1vZGVsIGZyb20gJy4uLy4uLy4uL2VkaXRvci9tb2RlbCc7XG5pbXBvcnQgSGlzdG9yeU1hbmFnZXIgZnJvbSAnLi4vLi4vLi4vZWRpdG9yL2hpc3RvcnknO1xuaW1wb3J0IHtzZXRTZWxlY3Rpb259IGZyb20gJy4uLy4uLy4uL2VkaXRvci9jYXJldCc7XG5pbXBvcnQge1xuICAgIGZvcm1hdFJhbmdlQXNRdW90ZSxcbiAgICBmb3JtYXRSYW5nZUFzQ29kZSxcbiAgICB0b2dnbGVJbmxpbmVGb3JtYXQsXG4gICAgcmVwbGFjZVJhbmdlQW5kTW92ZUNhcmV0LFxufSBmcm9tICcuLi8uLi8uLi9lZGl0b3Ivb3BlcmF0aW9ucyc7XG5pbXBvcnQge2dldENhcmV0T2Zmc2V0QW5kVGV4dCwgZ2V0UmFuZ2VGb3JTZWxlY3Rpb259IGZyb20gJy4uLy4uLy4uL2VkaXRvci9kb20nO1xuaW1wb3J0IEF1dG9jb21wbGV0ZSwge2dlbmVyYXRlQ29tcGxldGlvbkRvbUlkfSBmcm9tICcuLi9yb29tcy9BdXRvY29tcGxldGUnO1xuaW1wb3J0IHthdXRvQ29tcGxldGVDcmVhdG9yfSBmcm9tICcuLi8uLi8uLi9lZGl0b3IvcGFydHMnO1xuaW1wb3J0IHtwYXJzZVBsYWluVGV4dE1lc3NhZ2V9IGZyb20gJy4uLy4uLy4uL2VkaXRvci9kZXNlcmlhbGl6ZSc7XG5pbXBvcnQge3JlbmRlck1vZGVsfSBmcm9tICcuLi8uLi8uLi9lZGl0b3IvcmVuZGVyJztcbmltcG9ydCB7Um9vbX0gZnJvbSAnbWF0cml4LWpzLXNkayc7XG5pbXBvcnQgVHlwaW5nU3RvcmUgZnJvbSBcIi4uLy4uLy4uL3N0b3Jlcy9UeXBpbmdTdG9yZVwiO1xuaW1wb3J0IFNldHRpbmdzU3RvcmUgZnJvbSBcIi4uLy4uLy4uL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcbmltcG9ydCBFTU9USUNPTl9SRUdFWCBmcm9tICdlbW9qaWJhc2UtcmVnZXgvZW1vdGljb24nO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCB7S2V5fSBmcm9tIFwiLi4vLi4vLi4vS2V5Ym9hcmRcIjtcbmltcG9ydCB7RU1PVElDT05fVE9fRU1PSkl9IGZyb20gXCIuLi8uLi8uLi9lbW9qaVwiO1xuaW1wb3J0IHtDb21tYW5kQ2F0ZWdvcmllcywgQ29tbWFuZE1hcCwgcGFyc2VDb21tYW5kU3RyaW5nfSBmcm9tIFwiLi4vLi4vLi4vU2xhc2hDb21tYW5kc1wiO1xuXG5jb25zdCBSRUdFWF9FTU9USUNPTl9XSElURVNQQUNFID0gbmV3IFJlZ0V4cCgnKD86XnxcXFxccykoJyArIEVNT1RJQ09OX1JFR0VYLnNvdXJjZSArICcpXFxcXHMkJyk7XG5cbmNvbnN0IElTX01BQyA9IG5hdmlnYXRvci5wbGF0Zm9ybS5pbmRleE9mKFwiTWFjXCIpICE9PSAtMTtcblxuZnVuY3Rpb24gY3RybFNob3J0Y3V0TGFiZWwoa2V5KSB7XG4gICAgcmV0dXJuIChJU19NQUMgPyBcIuKMmFwiIDogXCJDdHJsXCIpICsgXCIrXCIgKyBrZXk7XG59XG5cbmZ1bmN0aW9uIGNsb25lU2VsZWN0aW9uKHNlbGVjdGlvbikge1xuICAgIHJldHVybiB7XG4gICAgICAgIGFuY2hvck5vZGU6IHNlbGVjdGlvbi5hbmNob3JOb2RlLFxuICAgICAgICBhbmNob3JPZmZzZXQ6IHNlbGVjdGlvbi5hbmNob3JPZmZzZXQsXG4gICAgICAgIGZvY3VzTm9kZTogc2VsZWN0aW9uLmZvY3VzTm9kZSxcbiAgICAgICAgZm9jdXNPZmZzZXQ6IHNlbGVjdGlvbi5mb2N1c09mZnNldCxcbiAgICAgICAgaXNDb2xsYXBzZWQ6IHNlbGVjdGlvbi5pc0NvbGxhcHNlZCxcbiAgICAgICAgcmFuZ2VDb3VudDogc2VsZWN0aW9uLnJhbmdlQ291bnQsXG4gICAgICAgIHR5cGU6IHNlbGVjdGlvbi50eXBlLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNlbGVjdGlvbkVxdWFscyhhOiBTZWxlY3Rpb24sIGI6IFNlbGVjdGlvbik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBhLmFuY2hvck5vZGUgPT09IGIuYW5jaG9yTm9kZSAmJlxuICAgICAgICBhLmFuY2hvck9mZnNldCA9PT0gYi5hbmNob3JPZmZzZXQgJiZcbiAgICAgICAgYS5mb2N1c05vZGUgPT09IGIuZm9jdXNOb2RlICYmXG4gICAgICAgIGEuZm9jdXNPZmZzZXQgPT09IGIuZm9jdXNPZmZzZXQgJiZcbiAgICAgICAgYS5pc0NvbGxhcHNlZCA9PT0gYi5pc0NvbGxhcHNlZCAmJlxuICAgICAgICBhLnJhbmdlQ291bnQgPT09IGIucmFuZ2VDb3VudCAmJlxuICAgICAgICBhLnR5cGUgPT09IGIudHlwZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQmFzaWNNZXNzYWdlRWRpdG9yIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBvbkNoYW5nZTogUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgIG1vZGVsOiBQcm9wVHlwZXMuaW5zdGFuY2VPZihFZGl0b3JNb2RlbCkuaXNSZXF1aXJlZCxcbiAgICAgICAgcm9vbTogUHJvcFR5cGVzLmluc3RhbmNlT2YoUm9vbSkuaXNSZXF1aXJlZCxcbiAgICAgICAgcGxhY2Vob2xkZXI6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIGxhYmVsOiBQcm9wVHlwZXMuc3RyaW5nLCAgICAvLyB0aGUgYXJpYSBsYWJlbFxuICAgICAgICBpbml0aWFsQ2FyZXQ6IFByb3BUeXBlcy5vYmplY3QsIC8vIFNlZSBEb2N1bWVudFBvc2l0aW9uIGluIGVkaXRvci9tb2RlbC5qc1xuICAgIH07XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBhdXRvQ29tcGxldGU6IG51bGwsXG4gICAgICAgICAgICBzaG93UGlsbEF2YXRhcjogU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcIlBpbGwuc2hvdWxkU2hvd1BpbGxBdmF0YXJcIiksXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX2VkaXRvclJlZiA9IG51bGw7XG4gICAgICAgIHRoaXMuX2F1dG9jb21wbGV0ZVJlZiA9IG51bGw7XG4gICAgICAgIHRoaXMuX2Zvcm1hdEJhclJlZiA9IG51bGw7XG4gICAgICAgIHRoaXMuX21vZGlmaWVkRmxhZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9pc0lNRUNvbXBvc2luZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9oYXNUZXh0U2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fZW1vdGljb25TZXR0aW5nSGFuZGxlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fc2hvdWxkU2hvd1BpbGxBdmF0YXJTZXR0aW5nSGFuZGxlID0gbnVsbDtcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzKSB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnBsYWNlaG9sZGVyICE9PSBwcmV2UHJvcHMucGxhY2Vob2xkZXIgJiYgdGhpcy5wcm9wcy5wbGFjZWhvbGRlcikge1xuICAgICAgICAgICAgY29uc3Qge2lzRW1wdHl9ID0gdGhpcy5wcm9wcy5tb2RlbDtcbiAgICAgICAgICAgIGlmIChpc0VtcHR5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvd1BsYWNlaG9sZGVyKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2hpZGVQbGFjZWhvbGRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3JlcGxhY2VFbW90aWNvbiA9IChjYXJldFBvc2l0aW9uLCBpbnB1dFR5cGUsIGRpZmYpID0+IHtcbiAgICAgICAgY29uc3Qge21vZGVsfSA9IHRoaXMucHJvcHM7XG4gICAgICAgIGNvbnN0IHJhbmdlID0gbW9kZWwuc3RhcnRSYW5nZShjYXJldFBvc2l0aW9uKTtcbiAgICAgICAgLy8gZXhwYW5kIHJhbmdlIG1heCA4IGNoYXJhY3RlcnMgYmFja3dhcmRzIGZyb20gY2FyZXRQb3NpdGlvbixcbiAgICAgICAgLy8gYXMgYSBzcGFjZSB0byBsb29rIGZvciBhbiBlbW90aWNvblxuICAgICAgICBsZXQgbiA9IDg7XG4gICAgICAgIHJhbmdlLmV4cGFuZEJhY2t3YXJkc1doaWxlKChpbmRleCwgb2Zmc2V0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJ0ID0gbW9kZWwucGFydHNbaW5kZXhdO1xuICAgICAgICAgICAgbiAtPSAxO1xuICAgICAgICAgICAgcmV0dXJuIG4gPj0gMCAmJiAocGFydC50eXBlID09PSBcInBsYWluXCIgfHwgcGFydC50eXBlID09PSBcInBpbGwtY2FuZGlkYXRlXCIpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZW1vdGljb25NYXRjaCA9IFJFR0VYX0VNT1RJQ09OX1dISVRFU1BBQ0UuZXhlYyhyYW5nZS50ZXh0KTtcbiAgICAgICAgaWYgKGVtb3RpY29uTWF0Y2gpIHtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gZW1vdGljb25NYXRjaFsxXS5yZXBsYWNlKFwiLVwiLCBcIlwiKTtcbiAgICAgICAgICAgIC8vIHRyeSBib3RoIGV4YWN0IG1hdGNoIGFuZCBsb3dlci1jYXNlLCB0aGlzIG1lYW5zIHRoYXQgeGQgd29uJ3QgbWF0Y2ggeEQgYnV0IDpQIHdpbGwgbWF0Y2ggOnBcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBFTU9USUNPTl9UT19FTU9KSS5nZXQocXVlcnkpIHx8IEVNT1RJQ09OX1RPX0VNT0pJLmdldChxdWVyeS50b0xvd2VyQ2FzZSgpKTtcblxuICAgICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7cGFydENyZWF0b3J9ID0gbW9kZWw7XG4gICAgICAgICAgICAgICAgY29uc3QgaGFzUHJlY2VkaW5nU3BhY2UgPSBlbW90aWNvbk1hdGNoWzBdWzBdID09PSBcIiBcIjtcbiAgICAgICAgICAgICAgICAvLyB3ZSBuZWVkIHRoZSByYW5nZSB0byBvbmx5IGNvbXByaXNlIG9mIHRoZSBlbW90aWNvblxuICAgICAgICAgICAgICAgIC8vIGJlY2F1c2Ugd2UnbGwgcmVwbGFjZSB0aGUgd2hvbGUgcmFuZ2Ugd2l0aCBhbiBlbW9qaSxcbiAgICAgICAgICAgICAgICAvLyBzbyBtb3ZlIHRoZSBzdGFydCBmb3J3YXJkIHRvIHRoZSBzdGFydCBvZiB0aGUgZW1vdGljb24uXG4gICAgICAgICAgICAgICAgLy8gVGFrZSArIDEgYmVjYXVzZSBpbmRleCBpcyByZXBvcnRlZCB3aXRob3V0IHRoZSBwb3NzaWJsZSBwcmVjZWRpbmcgc3BhY2UuXG4gICAgICAgICAgICAgICAgcmFuZ2UubW92ZVN0YXJ0KGVtb3RpY29uTWF0Y2guaW5kZXggKyAoaGFzUHJlY2VkaW5nU3BhY2UgPyAxIDogMCkpO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgcmV0dXJucyB0aGUgYW1vdW50IG9mIGFkZGVkL3JlbW92ZWQgY2hhcmFjdGVycyBkdXJpbmcgdGhlIHJlcGxhY2VcbiAgICAgICAgICAgICAgICAvLyBzbyB0aGUgY2FyZXQgcG9zaXRpb24gY2FuIGJlIGFkanVzdGVkLlxuICAgICAgICAgICAgICAgIHJldHVybiByYW5nZS5yZXBsYWNlKFtwYXJ0Q3JlYXRvci5wbGFpbihkYXRhLnVuaWNvZGUgKyBcIiBcIildKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIF91cGRhdGVFZGl0b3JTdGF0ZSA9IChzZWxlY3Rpb24sIGlucHV0VHlwZSwgZGlmZikgPT4ge1xuICAgICAgICByZW5kZXJNb2RlbCh0aGlzLl9lZGl0b3JSZWYsIHRoaXMucHJvcHMubW9kZWwpO1xuICAgICAgICBpZiAoc2VsZWN0aW9uKSB7IC8vIHNldCB0aGUgY2FyZXQvc2VsZWN0aW9uXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHNldFNlbGVjdGlvbih0aGlzLl9lZGl0b3JSZWYsIHRoaXMucHJvcHMubW9kZWwsIHNlbGVjdGlvbik7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiBjYXJldCBzZWxlY3Rpb24gaXMgYSByYW5nZSwgdGFrZSB0aGUgZW5kIHBvc2l0aW9uXG4gICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHNlbGVjdGlvbi5lbmQgfHwgc2VsZWN0aW9uO1xuICAgICAgICAgICAgdGhpcy5fc2V0TGFzdENhcmV0RnJvbVBvc2l0aW9uKHBvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7aXNFbXB0eX0gPSB0aGlzLnByb3BzLm1vZGVsO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5wbGFjZWhvbGRlcikge1xuICAgICAgICAgICAgaWYgKGlzRW1wdHkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zaG93UGxhY2Vob2xkZXIoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faGlkZVBsYWNlaG9sZGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzRW1wdHkpIHtcbiAgICAgICAgICAgIHRoaXMuX2Zvcm1hdEJhclJlZi5oaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7YXV0b0NvbXBsZXRlOiB0aGlzLnByb3BzLm1vZGVsLmF1dG9Db21wbGV0ZX0pO1xuICAgICAgICB0aGlzLmhpc3RvcnlNYW5hZ2VyLnRyeVB1c2godGhpcy5wcm9wcy5tb2RlbCwgc2VsZWN0aW9uLCBpbnB1dFR5cGUsIGRpZmYpO1xuXG4gICAgICAgIGxldCBpc1R5cGluZyA9ICF0aGlzLnByb3BzLm1vZGVsLmlzRW1wdHk7XG4gICAgICAgIC8vIElmIHRoZSB1c2VyIGlzIGVudGVyaW5nIGEgY29tbWFuZCwgb25seSBjb25zaWRlciB0aGVtIHR5cGluZyBpZiBpdCBpcyBvbmUgd2hpY2ggc2VuZHMgYSBtZXNzYWdlIGludG8gdGhlIHJvb21cbiAgICAgICAgaWYgKGlzVHlwaW5nICYmIHRoaXMucHJvcHMubW9kZWwucGFydHNbMF0udHlwZSA9PT0gXCJjb21tYW5kXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IHtjbWR9ID0gcGFyc2VDb21tYW5kU3RyaW5nKHRoaXMucHJvcHMubW9kZWwucGFydHNbMF0udGV4dCk7XG4gICAgICAgICAgICBpZiAoIUNvbW1hbmRNYXAuaGFzKGNtZCkgfHwgQ29tbWFuZE1hcC5nZXQoY21kKS5jYXRlZ29yeSAhPT0gQ29tbWFuZENhdGVnb3JpZXMubWVzc2FnZXMpIHtcbiAgICAgICAgICAgICAgICBpc1R5cGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFR5cGluZ1N0b3JlLnNoYXJlZEluc3RhbmNlKCkuc2V0U2VsZlR5cGluZyh0aGlzLnByb3BzLnJvb20ucm9vbUlkLCBpc1R5cGluZyk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25DaGFuZ2UpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9zaG93UGxhY2Vob2xkZXIoKSB7XG4gICAgICAgIHRoaXMuX2VkaXRvclJlZi5zdHlsZS5zZXRQcm9wZXJ0eShcIi0tcGxhY2Vob2xkZXJcIiwgYCcke3RoaXMucHJvcHMucGxhY2Vob2xkZXJ9J2ApO1xuICAgICAgICB0aGlzLl9lZGl0b3JSZWYuY2xhc3NMaXN0LmFkZChcIm14X0Jhc2ljTWVzc2FnZUNvbXBvc2VyX2lucHV0RW1wdHlcIik7XG4gICAgfVxuXG4gICAgX2hpZGVQbGFjZWhvbGRlcigpIHtcbiAgICAgICAgdGhpcy5fZWRpdG9yUmVmLmNsYXNzTGlzdC5yZW1vdmUoXCJteF9CYXNpY01lc3NhZ2VDb21wb3Nlcl9pbnB1dEVtcHR5XCIpO1xuICAgICAgICB0aGlzLl9lZGl0b3JSZWYuc3R5bGUucmVtb3ZlUHJvcGVydHkoXCItLXBsYWNlaG9sZGVyXCIpO1xuICAgIH1cblxuICAgIF9vbkNvbXBvc2l0aW9uU3RhcnQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy5faXNJTUVDb21wb3NpbmcgPSB0cnVlO1xuICAgICAgICAvLyBldmVuIGlmIHRoZSBtb2RlbCBpcyBlbXB0eSwgdGhlIGNvbXBvc2l0aW9uIHRleHQgc2hvdWxkbid0IGJlIG1peGVkIHdpdGggdGhlIHBsYWNlaG9sZGVyXG4gICAgICAgIHRoaXMuX2hpZGVQbGFjZWhvbGRlcigpO1xuICAgIH1cblxuICAgIF9vbkNvbXBvc2l0aW9uRW5kID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuX2lzSU1FQ29tcG9zaW5nID0gZmFsc2U7XG4gICAgICAgIC8vIHNvbWUgYnJvd3NlcnMgKENocm9tZSkgZG9uJ3QgZmlyZSBhbiBpbnB1dCBldmVudCBhZnRlciBlbmRpbmcgYSBjb21wb3NpdGlvbixcbiAgICAgICAgLy8gc28gdHJpZ2dlciBhIG1vZGVsIHVwZGF0ZSBhZnRlciB0aGUgY29tcG9zaXRpb24gaXMgZG9uZSBieSBjYWxsaW5nIHRoZSBpbnB1dCBoYW5kbGVyLlxuXG4gICAgICAgIC8vIGhvd2V2ZXIsIG1vZGlmeWluZyB0aGUgRE9NIChjYXVzZWQgYnkgdGhlIGVkaXRvciBtb2RlbCB1cGRhdGUpIGZyb20gdGhlIGNvbXBvc2l0aW9uZW5kIGhhbmRsZXIgc2VlbXNcbiAgICAgICAgLy8gdG8gY29uZnVzZSB0aGUgSU1FIGluIENocm9tZSwgbGlrZWx5IGNhdXNpbmcgaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS9yaW90LXdlYi9pc3N1ZXMvMTA5MTMgLFxuICAgICAgICAvLyBzbyB3ZSBkbyBpdCBhc3luY1xuXG4gICAgICAgIC8vIGhvd2V2ZXIsIGRvaW5nIHRoaXMgYXN5bmMgc2VlbXMgdG8gYnJlYWsgdGhpbmdzIGluIFNhZmFyaSBmb3Igc29tZSByZWFzb24sIHNvIGJyb3dzZXIgc25pZmYuXG5cbiAgICAgICAgY29uc3QgdWEgPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGNvbnN0IGlzU2FmYXJpID0gdWEuaW5jbHVkZXMoJ3NhZmFyaS8nKSAmJiAhdWEuaW5jbHVkZXMoJ2Nocm9tZS8nKTtcblxuICAgICAgICBpZiAoaXNTYWZhcmkpIHtcbiAgICAgICAgICAgIHRoaXMuX29uSW5wdXQoe2lucHV0VHlwZTogXCJpbnNlcnRDb21wb3NpdGlvblRleHRcIn0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fb25JbnB1dCh7aW5wdXRUeXBlOiBcImluc2VydENvbXBvc2l0aW9uVGV4dFwifSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlzQ29tcG9zaW5nKGV2ZW50KSB7XG4gICAgICAgIC8vIGNoZWNraW5nIHRoZSBldmVudC5pc0NvbXBvc2luZyBmbGFnIGp1c3QgaW4gY2FzZSBhbnkgYnJvd3NlciBvdXQgdGhlcmVcbiAgICAgICAgLy8gZW1pdHMgZXZlbnRzIHJlbGF0ZWQgdG8gdGhlIGNvbXBvc2l0aW9uIGFmdGVyIGNvbXBvc2l0aW9uZW5kXG4gICAgICAgIC8vIGhhcyBiZWVuIGZpcmVkXG4gICAgICAgIHJldHVybiAhISh0aGlzLl9pc0lNRUNvbXBvc2luZyB8fCAoZXZlbnQubmF0aXZlRXZlbnQgJiYgZXZlbnQubmF0aXZlRXZlbnQuaXNDb21wb3NpbmcpKTtcbiAgICB9XG5cbiAgICBfb25DdXRDb3B5ID0gKGV2ZW50LCB0eXBlKSA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IGRvY3VtZW50LmdldFNlbGVjdGlvbigpO1xuICAgICAgICBjb25zdCB0ZXh0ID0gc2VsZWN0aW9uLnRvU3RyaW5nKCk7XG4gICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICBjb25zdCB7bW9kZWx9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gZ2V0UmFuZ2VGb3JTZWxlY3Rpb24odGhpcy5fZWRpdG9yUmVmLCBtb2RlbCwgc2VsZWN0aW9uKTtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkUGFydHMgPSByYW5nZS5wYXJ0cy5tYXAocCA9PiBwLnNlcmlhbGl6ZSgpKTtcbiAgICAgICAgICAgIGV2ZW50LmNsaXBib2FyZERhdGEuc2V0RGF0YShcImFwcGxpY2F0aW9uL3gtcmlvdC1jb21wb3NlclwiLCBKU09OLnN0cmluZ2lmeShzZWxlY3RlZFBhcnRzKSk7XG4gICAgICAgICAgICBldmVudC5jbGlwYm9hcmREYXRhLnNldERhdGEoXCJ0ZXh0L3BsYWluXCIsIHRleHQpOyAvLyBzbyBwbGFpbiBjb3B5L3Bhc3RlIHdvcmtzXG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gXCJjdXRcIikge1xuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgdGV4dCwgdXBkYXRpbmcgdGhlIG1vZGVsIGFzIGFwcHJvcHJpYXRlXG4gICAgICAgICAgICAgICAgdGhpcy5fbW9kaWZpZWRGbGFnID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXBsYWNlUmFuZ2VBbmRNb3ZlQ2FyZXQocmFuZ2UsIFtdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfb25Db3B5ID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuX29uQ3V0Q29weShldmVudCwgXCJjb3B5XCIpO1xuICAgIH1cblxuICAgIF9vbkN1dCA9IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLl9vbkN1dENvcHkoZXZlbnQsIFwiY3V0XCIpO1xuICAgIH1cblxuICAgIF9vblBhc3RlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHttb2RlbH0gPSB0aGlzLnByb3BzO1xuICAgICAgICBjb25zdCB7cGFydENyZWF0b3J9ID0gbW9kZWw7XG4gICAgICAgIGNvbnN0IHBhcnRzVGV4dCA9IGV2ZW50LmNsaXBib2FyZERhdGEuZ2V0RGF0YShcImFwcGxpY2F0aW9uL3gtcmlvdC1jb21wb3NlclwiKTtcbiAgICAgICAgbGV0IHBhcnRzO1xuICAgICAgICBpZiAocGFydHNUZXh0KSB7XG4gICAgICAgICAgICBjb25zdCBzZXJpYWxpemVkVGV4dFBhcnRzID0gSlNPTi5wYXJzZShwYXJ0c1RleHQpO1xuICAgICAgICAgICAgY29uc3QgZGVzZXJpYWxpemVkUGFydHMgPSBzZXJpYWxpemVkVGV4dFBhcnRzLm1hcChwID0+IHBhcnRDcmVhdG9yLmRlc2VyaWFsaXplUGFydChwKSk7XG4gICAgICAgICAgICBwYXJ0cyA9IGRlc2VyaWFsaXplZFBhcnRzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgdGV4dCA9IGV2ZW50LmNsaXBib2FyZERhdGEuZ2V0RGF0YShcInRleHQvcGxhaW5cIik7XG4gICAgICAgICAgICBwYXJ0cyA9IHBhcnNlUGxhaW5UZXh0TWVzc2FnZSh0ZXh0LCBwYXJ0Q3JlYXRvcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbW9kaWZpZWRGbGFnID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgcmFuZ2UgPSBnZXRSYW5nZUZvclNlbGVjdGlvbih0aGlzLl9lZGl0b3JSZWYsIG1vZGVsLCBkb2N1bWVudC5nZXRTZWxlY3Rpb24oKSk7XG4gICAgICAgIHJlcGxhY2VSYW5nZUFuZE1vdmVDYXJldChyYW5nZSwgcGFydHMpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIF9vbklucHV0ID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIC8vIGlnbm9yZSBhbnkgaW5wdXQgd2hpbGUgZG9pbmcgSU1FIGNvbXBvc2l0aW9uc1xuICAgICAgICBpZiAodGhpcy5faXNJTUVDb21wb3NpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9tb2RpZmllZEZsYWcgPSB0cnVlO1xuICAgICAgICBjb25zdCBzZWwgPSBkb2N1bWVudC5nZXRTZWxlY3Rpb24oKTtcbiAgICAgICAgY29uc3Qge2NhcmV0LCB0ZXh0fSA9IGdldENhcmV0T2Zmc2V0QW5kVGV4dCh0aGlzLl9lZGl0b3JSZWYsIHNlbCk7XG4gICAgICAgIHRoaXMucHJvcHMubW9kZWwudXBkYXRlKHRleHQsIGV2ZW50LmlucHV0VHlwZSwgY2FyZXQpO1xuICAgIH1cblxuICAgIF9pbnNlcnRUZXh0KHRleHRUb0luc2VydCwgaW5wdXRUeXBlID0gXCJpbnNlcnRUZXh0XCIpIHtcbiAgICAgICAgY29uc3Qgc2VsID0gZG9jdW1lbnQuZ2V0U2VsZWN0aW9uKCk7XG4gICAgICAgIGNvbnN0IHtjYXJldCwgdGV4dH0gPSBnZXRDYXJldE9mZnNldEFuZFRleHQodGhpcy5fZWRpdG9yUmVmLCBzZWwpO1xuICAgICAgICBjb25zdCBuZXdUZXh0ID0gdGV4dC5zdWJzdHIoMCwgY2FyZXQub2Zmc2V0KSArIHRleHRUb0luc2VydCArIHRleHQuc3Vic3RyKGNhcmV0Lm9mZnNldCk7XG4gICAgICAgIGNhcmV0Lm9mZnNldCArPSB0ZXh0VG9JbnNlcnQubGVuZ3RoO1xuICAgICAgICB0aGlzLl9tb2RpZmllZEZsYWcgPSB0cnVlO1xuICAgICAgICB0aGlzLnByb3BzLm1vZGVsLnVwZGF0ZShuZXdUZXh0LCBpbnB1dFR5cGUsIGNhcmV0KTtcbiAgICB9XG5cbiAgICAvLyB0aGlzIGlzIHVzZWQgbGF0ZXIgdG8gc2VlIGlmIHdlIG5lZWQgdG8gcmVjYWxjdWxhdGUgdGhlIGNhcmV0XG4gICAgLy8gb24gc2VsZWN0aW9uY2hhbmdlLiBJZiBpdCBpcyBqdXN0IGEgY29uc2VxdWVuY2Ugb2YgdHlwaW5nXG4gICAgLy8gd2UgZG9uJ3QgbmVlZCB0by4gQnV0IGlmIHRoZSB1c2VyIGlzIG5hdmlnYXRpbmcgdGhlIGNhcmV0IHdpdGhvdXQgaW5wdXRcbiAgICAvLyB3ZSBuZWVkIHRvIHJlY2FsY3VsYXRlIGl0LCB0byBiZSBhYmxlIHRvIGtub3cgd2hlcmUgdG8gaW5zZXJ0IGNvbnRlbnQgYWZ0ZXJcbiAgICAvLyBsb3NpbmcgZm9jdXNcbiAgICBfc2V0TGFzdENhcmV0RnJvbVBvc2l0aW9uKHBvc2l0aW9uKSB7XG4gICAgICAgIGNvbnN0IHttb2RlbH0gPSB0aGlzLnByb3BzO1xuICAgICAgICB0aGlzLl9pc0NhcmV0QXRFbmQgPSBwb3NpdGlvbi5pc0F0RW5kKG1vZGVsKTtcbiAgICAgICAgdGhpcy5fbGFzdENhcmV0ID0gcG9zaXRpb24uYXNPZmZzZXQobW9kZWwpO1xuICAgICAgICB0aGlzLl9sYXN0U2VsZWN0aW9uID0gY2xvbmVTZWxlY3Rpb24oZG9jdW1lbnQuZ2V0U2VsZWN0aW9uKCkpO1xuICAgIH1cblxuICAgIF9yZWZyZXNoTGFzdENhcmV0SWZOZWVkZWQoKSB7XG4gICAgICAgIC8vIFhYWDogbmVlZGVkIHdoZW4gZ29pbmcgdXAgYW5kIGRvd24gaW4gZWRpdGluZyBtZXNzYWdlcyAuLi4gbm90IHN1cmUgd2h5IHlldFxuICAgICAgICAvLyBiZWNhdXNlIHRoZSBlZGl0b3JzIHNob3VsZCBzdG9wIGRvaW5nIHRoaXMgd2hlbiB3aGVuIGJsdXJyZWQgLi4uXG4gICAgICAgIC8vIG1heWJlIGl0J3Mgb24gZm9jdXMgYW5kIHRoZSBfZWRpdG9yUmVmIGlzbid0IGF2YWlsYWJsZSB5ZXQgb3Igc29tZXRoaW5nLlxuICAgICAgICBpZiAoIXRoaXMuX2VkaXRvclJlZikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IGRvY3VtZW50LmdldFNlbGVjdGlvbigpO1xuICAgICAgICBpZiAoIXRoaXMuX2xhc3RTZWxlY3Rpb24gfHwgIXNlbGVjdGlvbkVxdWFscyh0aGlzLl9sYXN0U2VsZWN0aW9uLCBzZWxlY3Rpb24pKSB7XG4gICAgICAgICAgICB0aGlzLl9sYXN0U2VsZWN0aW9uID0gY2xvbmVTZWxlY3Rpb24oc2VsZWN0aW9uKTtcbiAgICAgICAgICAgIGNvbnN0IHtjYXJldCwgdGV4dH0gPSBnZXRDYXJldE9mZnNldEFuZFRleHQodGhpcy5fZWRpdG9yUmVmLCBzZWxlY3Rpb24pO1xuICAgICAgICAgICAgdGhpcy5fbGFzdENhcmV0ID0gY2FyZXQ7XG4gICAgICAgICAgICB0aGlzLl9pc0NhcmV0QXRFbmQgPSBjYXJldC5vZmZzZXQgPT09IHRleHQubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9sYXN0Q2FyZXQ7XG4gICAgfVxuXG4gICAgY2xlYXJVbmRvSGlzdG9yeSgpIHtcbiAgICAgICAgdGhpcy5oaXN0b3J5TWFuYWdlci5jbGVhcigpO1xuICAgIH1cblxuICAgIGdldENhcmV0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbGFzdENhcmV0O1xuICAgIH1cblxuICAgIGlzU2VsZWN0aW9uQ29sbGFwc2VkKCkge1xuICAgICAgICByZXR1cm4gIXRoaXMuX2xhc3RTZWxlY3Rpb24gfHwgdGhpcy5fbGFzdFNlbGVjdGlvbi5pc0NvbGxhcHNlZDtcbiAgICB9XG5cbiAgICBpc0NhcmV0QXRTdGFydCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q2FyZXQoKS5vZmZzZXQgPT09IDA7XG4gICAgfVxuXG4gICAgaXNDYXJldEF0RW5kKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNDYXJldEF0RW5kO1xuICAgIH1cblxuICAgIF9vbkJsdXIgPSAoKSA9PiB7XG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJzZWxlY3Rpb25jaGFuZ2VcIiwgdGhpcy5fb25TZWxlY3Rpb25DaGFuZ2UpO1xuICAgIH1cblxuICAgIF9vbkZvY3VzID0gKCkgPT4ge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwic2VsZWN0aW9uY2hhbmdlXCIsIHRoaXMuX29uU2VsZWN0aW9uQ2hhbmdlKTtcbiAgICAgICAgLy8gZm9yY2UgdG8gcmVjYWxjdWxhdGVcbiAgICAgICAgdGhpcy5fbGFzdFNlbGVjdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMuX3JlZnJlc2hMYXN0Q2FyZXRJZk5lZWRlZCgpO1xuICAgIH1cblxuICAgIF9vblNlbGVjdGlvbkNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5fcmVmcmVzaExhc3RDYXJldElmTmVlZGVkKCk7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IGRvY3VtZW50LmdldFNlbGVjdGlvbigpO1xuICAgICAgICBpZiAodGhpcy5faGFzVGV4dFNlbGVjdGVkICYmIHNlbGVjdGlvbi5pc0NvbGxhcHNlZCkge1xuICAgICAgICAgICAgdGhpcy5faGFzVGV4dFNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5fZm9ybWF0QmFyUmVmKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZm9ybWF0QmFyUmVmLmhpZGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghc2VsZWN0aW9uLmlzQ29sbGFwc2VkKSB7XG4gICAgICAgICAgICB0aGlzLl9oYXNUZXh0U2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2Zvcm1hdEJhclJlZikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdGlvblJlY3QgPSBzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9mb3JtYXRCYXJSZWYuc2hvd0F0KHNlbGVjdGlvblJlY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgX29uS2V5RG93biA9IChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCBtb2RlbCA9IHRoaXMucHJvcHMubW9kZWw7XG4gICAgICAgIGNvbnN0IG1vZEtleSA9IElTX01BQyA/IGV2ZW50Lm1ldGFLZXkgOiBldmVudC5jdHJsS2V5O1xuICAgICAgICBsZXQgaGFuZGxlZCA9IGZhbHNlO1xuICAgICAgICAvLyBmb3JtYXQgYm9sZFxuICAgICAgICBpZiAobW9kS2V5ICYmIGV2ZW50LmtleSA9PT0gS2V5LkIpIHtcbiAgICAgICAgICAgIHRoaXMuX29uRm9ybWF0QWN0aW9uKFwiYm9sZFwiKTtcbiAgICAgICAgICAgIGhhbmRsZWQgPSB0cnVlO1xuICAgICAgICAvLyBmb3JtYXQgaXRhbGljc1xuICAgICAgICB9IGVsc2UgaWYgKG1vZEtleSAmJiBldmVudC5rZXkgPT09IEtleS5JKSB7XG4gICAgICAgICAgICB0aGlzLl9vbkZvcm1hdEFjdGlvbihcIml0YWxpY3NcIik7XG4gICAgICAgICAgICBoYW5kbGVkID0gdHJ1ZTtcbiAgICAgICAgLy8gZm9ybWF0IHF1b3RlXG4gICAgICAgIH0gZWxzZSBpZiAobW9kS2V5ICYmIGV2ZW50LmtleSA9PT0gS2V5LkdSRUFURVJfVEhBTikge1xuICAgICAgICAgICAgdGhpcy5fb25Gb3JtYXRBY3Rpb24oXCJxdW90ZVwiKTtcbiAgICAgICAgICAgIGhhbmRsZWQgPSB0cnVlO1xuICAgICAgICAvLyByZWRvXG4gICAgICAgIH0gZWxzZSBpZiAoKCFJU19NQUMgJiYgbW9kS2V5ICYmIGV2ZW50LmtleSA9PT0gS2V5LlkpIHx8XG4gICAgICAgICAgICAgICAgICAoSVNfTUFDICYmIG1vZEtleSAmJiBldmVudC5zaGlmdEtleSAmJiBldmVudC5rZXkgPT09IEtleS5aKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaGlzdG9yeU1hbmFnZXIuY2FuUmVkbygpKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qge3BhcnRzLCBjYXJldH0gPSB0aGlzLmhpc3RvcnlNYW5hZ2VyLnJlZG8oKTtcbiAgICAgICAgICAgICAgICAvLyBwYXNzIG1hdGNoaW5nIGlucHV0VHlwZSBzbyBoaXN0b3J5TWFuYWdlciBkb2Vzbid0IHB1c2ggZWNob1xuICAgICAgICAgICAgICAgIC8vIHdoZW4gaW52b2tlZCBmcm9tIHJlcmVuZGVyIGNhbGxiYWNrLlxuICAgICAgICAgICAgICAgIG1vZGVsLnJlc2V0KHBhcnRzLCBjYXJldCwgXCJoaXN0b3J5UmVkb1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGhhbmRsZWQgPSB0cnVlO1xuICAgICAgICAvLyB1bmRvXG4gICAgICAgIH0gZWxzZSBpZiAobW9kS2V5ICYmIGV2ZW50LmtleSA9PT0gS2V5LlopIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhpc3RvcnlNYW5hZ2VyLmNhblVuZG8oKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHtwYXJ0cywgY2FyZXR9ID0gdGhpcy5oaXN0b3J5TWFuYWdlci51bmRvKHRoaXMucHJvcHMubW9kZWwpO1xuICAgICAgICAgICAgICAgIC8vIHBhc3MgbWF0Y2hpbmcgaW5wdXRUeXBlIHNvIGhpc3RvcnlNYW5hZ2VyIGRvZXNuJ3QgcHVzaCBlY2hvXG4gICAgICAgICAgICAgICAgLy8gd2hlbiBpbnZva2VkIGZyb20gcmVyZW5kZXIgY2FsbGJhY2suXG4gICAgICAgICAgICAgICAgbW9kZWwucmVzZXQocGFydHMsIGNhcmV0LCBcImhpc3RvcnlVbmRvXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaGFuZGxlZCA9IHRydWU7XG4gICAgICAgIC8vIGluc2VydCBuZXdsaW5lIG9uIFNoaWZ0K0VudGVyXG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnQua2V5ID09PSBLZXkuRU5URVIgJiYgKGV2ZW50LnNoaWZ0S2V5IHx8IChJU19NQUMgJiYgZXZlbnQuYWx0S2V5KSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2luc2VydFRleHQoXCJcXG5cIik7XG4gICAgICAgICAgICBoYW5kbGVkID0gdHJ1ZTtcbiAgICAgICAgLy8gbW92ZSBzZWxlY3Rpb24gdG8gc3RhcnQgb2YgY29tcG9zZXJcbiAgICAgICAgfSBlbHNlIGlmIChtb2RLZXkgJiYgZXZlbnQua2V5ID09PSBLZXkuSE9NRSAmJiAhZXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgIHNldFNlbGVjdGlvbih0aGlzLl9lZGl0b3JSZWYsIG1vZGVsLCB7XG4gICAgICAgICAgICAgICAgaW5kZXg6IDAsXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiAwLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBoYW5kbGVkID0gdHJ1ZTtcbiAgICAgICAgLy8gbW92ZSBzZWxlY3Rpb24gdG8gZW5kIG9mIGNvbXBvc2VyXG4gICAgICAgIH0gZWxzZSBpZiAobW9kS2V5ICYmIGV2ZW50LmtleSA9PT0gS2V5LkVORCAmJiAhZXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgIHNldFNlbGVjdGlvbih0aGlzLl9lZGl0b3JSZWYsIG1vZGVsLCB7XG4gICAgICAgICAgICAgICAgaW5kZXg6IG1vZGVsLnBhcnRzLmxlbmd0aCAtIDEsXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiBtb2RlbC5wYXJ0c1ttb2RlbC5wYXJ0cy5sZW5ndGggLSAxXS50ZXh0Lmxlbmd0aCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaGFuZGxlZCA9IHRydWU7XG4gICAgICAgIC8vIGF1dG9jb21wbGV0ZSBvciBlbnRlciB0byBzZW5kIGJlbG93IHNob3VsZG4ndCBoYXZlIGFueSBtb2RpZmllciBrZXlzIHByZXNzZWQuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBtZXRhT3JBbHRQcmVzc2VkID0gZXZlbnQubWV0YUtleSB8fCBldmVudC5hbHRLZXk7XG4gICAgICAgICAgICBjb25zdCBtb2RpZmllclByZXNzZWQgPSBtZXRhT3JBbHRQcmVzc2VkIHx8IGV2ZW50LnNoaWZ0S2V5O1xuICAgICAgICAgICAgaWYgKG1vZGVsLmF1dG9Db21wbGV0ZSAmJiBtb2RlbC5hdXRvQ29tcGxldGUuaGFzQ29tcGxldGlvbnMoKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGF1dG9Db21wbGV0ZSA9IG1vZGVsLmF1dG9Db21wbGV0ZTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGV2ZW50LmtleSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIEtleS5BUlJPV19VUDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbW9kaWZpZXJQcmVzc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0NvbXBsZXRlLm9uVXBBcnJvdyhldmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBLZXkuQVJST1dfRE9XTjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbW9kaWZpZXJQcmVzc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0NvbXBsZXRlLm9uRG93bkFycm93KGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIEtleS5UQUI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW1ldGFPckFsdFByZXNzZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvQ29tcGxldGUub25UYWIoZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgS2V5LkVTQ0FQRTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbW9kaWZpZXJQcmVzc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0NvbXBsZXRlLm9uRXNjYXBlKGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBkb24ndCBwcmV2ZW50RGVmYXVsdCBvbiBhbnl0aGluZyBlbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5rZXkgPT09IEtleS5UQUIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl90YWJDb21wbGV0ZU5hbWUoKTtcbiAgICAgICAgICAgICAgICBoYW5kbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQua2V5ID09PSBLZXkuQkFDS1NQQUNFIHx8IGV2ZW50LmtleSA9PT0gS2V5LkRFTEVURSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2Zvcm1hdEJhclJlZi5oaWRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhhbmRsZWQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIF90YWJDb21wbGV0ZU5hbWUoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHRoaXMuc2V0U3RhdGUoe3Nob3dWaXN1YWxCZWxsOiBmYWxzZX0sIHJlc29sdmUpKTtcbiAgICAgICAgICAgIGNvbnN0IHttb2RlbH0gPSB0aGlzLnByb3BzO1xuICAgICAgICAgICAgY29uc3QgY2FyZXQgPSB0aGlzLmdldENhcmV0KCk7XG4gICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9IG1vZGVsLnBvc2l0aW9uRm9yT2Zmc2V0KGNhcmV0Lm9mZnNldCwgY2FyZXQuYXROb2RlRW5kKTtcbiAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gbW9kZWwuc3RhcnRSYW5nZShwb3NpdGlvbik7XG4gICAgICAgICAgICByYW5nZS5leHBhbmRCYWNrd2FyZHNXaGlsZSgoaW5kZXgsIG9mZnNldCwgcGFydCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJ0LnRleHRbb2Zmc2V0XSAhPT0gXCIgXCIgJiYgKFxuICAgICAgICAgICAgICAgICAgICBwYXJ0LnR5cGUgPT09IFwicGxhaW5cIiB8fFxuICAgICAgICAgICAgICAgICAgICBwYXJ0LnR5cGUgPT09IFwicGlsbC1jYW5kaWRhdGVcIiB8fFxuICAgICAgICAgICAgICAgICAgICBwYXJ0LnR5cGUgPT09IFwiY29tbWFuZFwiXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3Qge3BhcnRDcmVhdG9yfSA9IG1vZGVsO1xuICAgICAgICAgICAgLy8gYXdhaXQgZm9yIGF1dG8tY29tcGxldGUgdG8gYmUgb3BlblxuICAgICAgICAgICAgYXdhaXQgbW9kZWwudHJhbnNmb3JtKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhZGRlZExlbiA9IHJhbmdlLnJlcGxhY2UoW3BhcnRDcmVhdG9yLnBpbGxDYW5kaWRhdGUocmFuZ2UudGV4dCldKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9kZWwucG9zaXRpb25Gb3JPZmZzZXQoY2FyZXQub2Zmc2V0ICsgYWRkZWRMZW4sIHRydWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIERvbid0IHRyeSB0byBkbyB0aGluZ3Mgd2l0aCB0aGUgYXV0b2NvbXBsZXRlIGlmIHRoZXJlIGlzIG5vbmUgc2hvd25cbiAgICAgICAgICAgIGlmIChtb2RlbC5hdXRvQ29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBtb2RlbC5hdXRvQ29tcGxldGUub25UYWIoKTtcbiAgICAgICAgICAgICAgICBpZiAoIW1vZGVsLmF1dG9Db21wbGV0ZS5oYXNTZWxlY3Rpb24oKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93VmlzdWFsQmVsbDogdHJ1ZX0pO1xuICAgICAgICAgICAgICAgICAgICBtb2RlbC5hdXRvQ29tcGxldGUuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0RWRpdGFibGVSb290Tm9kZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VkaXRvclJlZjtcbiAgICB9XG5cbiAgICBpc01vZGlmaWVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbW9kaWZpZWRGbGFnO1xuICAgIH1cblxuICAgIF9vbkF1dG9Db21wbGV0ZUNvbmZpcm0gPSAoY29tcGxldGlvbikgPT4ge1xuICAgICAgICB0aGlzLnByb3BzLm1vZGVsLmF1dG9Db21wbGV0ZS5vbkNvbXBvbmVudENvbmZpcm0oY29tcGxldGlvbik7XG4gICAgfVxuXG4gICAgX29uQXV0b0NvbXBsZXRlU2VsZWN0aW9uQ2hhbmdlID0gKGNvbXBsZXRpb24sIGNvbXBsZXRpb25JbmRleCkgPT4ge1xuICAgICAgICB0aGlzLnByb3BzLm1vZGVsLmF1dG9Db21wbGV0ZS5vbkNvbXBvbmVudFNlbGVjdGlvbkNoYW5nZShjb21wbGV0aW9uKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Y29tcGxldGlvbkluZGV4fSk7XG4gICAgfVxuXG4gICAgX2NvbmZpZ3VyZUVtb3RpY29uQXV0b1JlcGxhY2UgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNob3VsZFJlcGxhY2UgPSBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKCdNZXNzYWdlQ29tcG9zZXJJbnB1dC5hdXRvUmVwbGFjZUVtb2ppJyk7XG4gICAgICAgIHRoaXMucHJvcHMubW9kZWwuc2V0VHJhbnNmb3JtQ2FsbGJhY2soc2hvdWxkUmVwbGFjZSA/IHRoaXMuX3JlcGxhY2VFbW90aWNvbiA6IG51bGwpO1xuICAgIH07XG5cbiAgICBfY29uZmlndXJlU2hvdWxkU2hvd1BpbGxBdmF0YXIgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNob3dQaWxsQXZhdGFyID0gU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcIlBpbGwuc2hvdWxkU2hvd1BpbGxBdmF0YXJcIik7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBzaG93UGlsbEF2YXRhciB9KTtcbiAgICB9O1xuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJzZWxlY3Rpb25jaGFuZ2VcIiwgdGhpcy5fb25TZWxlY3Rpb25DaGFuZ2UpO1xuICAgICAgICB0aGlzLl9lZGl0b3JSZWYucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIHRoaXMuX29uSW5wdXQsIHRydWUpO1xuICAgICAgICB0aGlzLl9lZGl0b3JSZWYucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNvbXBvc2l0aW9uc3RhcnRcIiwgdGhpcy5fb25Db21wb3NpdGlvblN0YXJ0LCB0cnVlKTtcbiAgICAgICAgdGhpcy5fZWRpdG9yUmVmLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjb21wb3NpdGlvbmVuZFwiLCB0aGlzLl9vbkNvbXBvc2l0aW9uRW5kLCB0cnVlKTtcbiAgICAgICAgU2V0dGluZ3NTdG9yZS51bndhdGNoU2V0dGluZyh0aGlzLl9lbW90aWNvblNldHRpbmdIYW5kbGUpO1xuICAgICAgICBTZXR0aW5nc1N0b3JlLnVud2F0Y2hTZXR0aW5nKHRoaXMuX3Nob3VsZFNob3dQaWxsQXZhdGFyU2V0dGluZ0hhbmRsZSk7XG4gICAgfVxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIGNvbnN0IG1vZGVsID0gdGhpcy5wcm9wcy5tb2RlbDtcbiAgICAgICAgbW9kZWwuc2V0VXBkYXRlQ2FsbGJhY2sodGhpcy5fdXBkYXRlRWRpdG9yU3RhdGUpO1xuICAgICAgICB0aGlzLl9lbW90aWNvblNldHRpbmdIYW5kbGUgPSBTZXR0aW5nc1N0b3JlLndhdGNoU2V0dGluZygnTWVzc2FnZUNvbXBvc2VySW5wdXQuYXV0b1JlcGxhY2VFbW9qaScsIG51bGwsXG4gICAgICAgICAgICB0aGlzLl9jb25maWd1cmVFbW90aWNvbkF1dG9SZXBsYWNlKTtcbiAgICAgICAgdGhpcy5fY29uZmlndXJlRW1vdGljb25BdXRvUmVwbGFjZSgpO1xuICAgICAgICB0aGlzLl9zaG91bGRTaG93UGlsbEF2YXRhclNldHRpbmdIYW5kbGUgPSBTZXR0aW5nc1N0b3JlLndhdGNoU2V0dGluZyhcIlBpbGwuc2hvdWxkU2hvd1BpbGxBdmF0YXJcIiwgbnVsbCxcbiAgICAgICAgICAgIHRoaXMuX2NvbmZpZ3VyZVNob3VsZFNob3dQaWxsQXZhdGFyKTtcbiAgICAgICAgY29uc3QgcGFydENyZWF0b3IgPSBtb2RlbC5wYXJ0Q3JlYXRvcjtcbiAgICAgICAgLy8gVE9ETzogZG9lcyB0aGlzIGFsbG93IHVzIHRvIGdldCByaWQgb2YgRWRpdG9yU3RhdGVUcmFuc2Zlcj9cbiAgICAgICAgLy8gbm90IHJlYWxseSwgYnV0IHdlIGNvdWxkIG5vdCBzZXJpYWxpemUgdGhlIHBhcnRzLCBhbmQganVzdCBjaGFuZ2UgdGhlIGF1dG9Db21wbGV0ZXJcbiAgICAgICAgcGFydENyZWF0b3Iuc2V0QXV0b0NvbXBsZXRlQ3JlYXRvcihhdXRvQ29tcGxldGVDcmVhdG9yKFxuICAgICAgICAgICAgKCkgPT4gdGhpcy5fYXV0b2NvbXBsZXRlUmVmLFxuICAgICAgICAgICAgcXVlcnkgPT4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB0aGlzLnNldFN0YXRlKHtxdWVyeX0sIHJlc29sdmUpKSxcbiAgICAgICAgKSk7XG4gICAgICAgIHRoaXMuaGlzdG9yeU1hbmFnZXIgPSBuZXcgSGlzdG9yeU1hbmFnZXIocGFydENyZWF0b3IpO1xuICAgICAgICAvLyBpbml0aWFsIHJlbmRlciBvZiBtb2RlbFxuICAgICAgICB0aGlzLl91cGRhdGVFZGl0b3JTdGF0ZSh0aGlzLl9nZXRJbml0aWFsQ2FyZXRQb3NpdGlvbigpKTtcbiAgICAgICAgLy8gYXR0YWNoIGlucHV0IGxpc3RlbmVyIGJ5IGhhbmQgc28gUmVhY3QgZG9lc24ndCBwcm94eSB0aGUgZXZlbnRzLFxuICAgICAgICAvLyBhcyB0aGUgcHJveGllZCBldmVudCBkb2Vzbid0IHN1cHBvcnQgaW5wdXRUeXBlLCB3aGljaCB3ZSBuZWVkLlxuICAgICAgICB0aGlzLl9lZGl0b3JSZWYuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIHRoaXMuX29uSW5wdXQsIHRydWUpO1xuICAgICAgICB0aGlzLl9lZGl0b3JSZWYuYWRkRXZlbnRMaXN0ZW5lcihcImNvbXBvc2l0aW9uc3RhcnRcIiwgdGhpcy5fb25Db21wb3NpdGlvblN0YXJ0LCB0cnVlKTtcbiAgICAgICAgdGhpcy5fZWRpdG9yUmVmLmFkZEV2ZW50TGlzdGVuZXIoXCJjb21wb3NpdGlvbmVuZFwiLCB0aGlzLl9vbkNvbXBvc2l0aW9uRW5kLCB0cnVlKTtcbiAgICAgICAgdGhpcy5fZWRpdG9yUmVmLmZvY3VzKCk7XG4gICAgfVxuXG4gICAgX2dldEluaXRpYWxDYXJldFBvc2l0aW9uKCkge1xuICAgICAgICBsZXQgY2FyZXRQb3NpdGlvbjtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuaW5pdGlhbENhcmV0KSB7XG4gICAgICAgICAgICAvLyBpZiByZXN0b3Jpbmcgc3RhdGUgZnJvbSBhIHByZXZpb3VzIGVkaXRvcixcbiAgICAgICAgICAgIC8vIHJlc3RvcmUgY2FyZXQgcG9zaXRpb24gZnJvbSB0aGUgc3RhdGVcbiAgICAgICAgICAgIGNvbnN0IGNhcmV0ID0gdGhpcy5wcm9wcy5pbml0aWFsQ2FyZXQ7XG4gICAgICAgICAgICBjYXJldFBvc2l0aW9uID0gdGhpcy5wcm9wcy5tb2RlbC5wb3NpdGlvbkZvck9mZnNldChjYXJldC5vZmZzZXQsIGNhcmV0LmF0Tm9kZUVuZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIHNldCBpdCBhdCB0aGUgZW5kXG4gICAgICAgICAgICBjYXJldFBvc2l0aW9uID0gdGhpcy5wcm9wcy5tb2RlbC5nZXRQb3NpdGlvbkF0RW5kKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhcmV0UG9zaXRpb247XG4gICAgfVxuXG4gICAgX29uRm9ybWF0QWN0aW9uID0gKGFjdGlvbikgPT4ge1xuICAgICAgICBjb25zdCByYW5nZSA9IGdldFJhbmdlRm9yU2VsZWN0aW9uKFxuICAgICAgICAgICAgdGhpcy5fZWRpdG9yUmVmLFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5tb2RlbCxcbiAgICAgICAgICAgIGRvY3VtZW50LmdldFNlbGVjdGlvbigpKTtcbiAgICAgICAgaWYgKHJhbmdlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaGlzdG9yeU1hbmFnZXIuZW5zdXJlTGFzdENoYW5nZXNQdXNoZWQodGhpcy5wcm9wcy5tb2RlbCk7XG4gICAgICAgIHRoaXMuX21vZGlmaWVkRmxhZyA9IHRydWU7XG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlIFwiYm9sZFwiOlxuICAgICAgICAgICAgICAgIHRvZ2dsZUlubGluZUZvcm1hdChyYW5nZSwgXCIqKlwiKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJpdGFsaWNzXCI6XG4gICAgICAgICAgICAgICAgdG9nZ2xlSW5saW5lRm9ybWF0KHJhbmdlLCBcIl9cIik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwic3RyaWtldGhyb3VnaFwiOlxuICAgICAgICAgICAgICAgIHRvZ2dsZUlubGluZUZvcm1hdChyYW5nZSwgXCI8ZGVsPlwiLCBcIjwvZGVsPlwiKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJjb2RlXCI6XG4gICAgICAgICAgICAgICAgZm9ybWF0UmFuZ2VBc0NvZGUocmFuZ2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInF1b3RlXCI6XG4gICAgICAgICAgICAgICAgZm9ybWF0UmFuZ2VBc1F1b3RlKHJhbmdlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGF1dG9Db21wbGV0ZTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuYXV0b0NvbXBsZXRlKSB7XG4gICAgICAgICAgICBjb25zdCBxdWVyeSA9IHRoaXMuc3RhdGUucXVlcnk7XG4gICAgICAgICAgICBjb25zdCBxdWVyeUxlbiA9IHF1ZXJ5Lmxlbmd0aDtcbiAgICAgICAgICAgIGF1dG9Db21wbGV0ZSA9ICg8ZGl2IGNsYXNzTmFtZT1cIm14X0Jhc2ljTWVzc2FnZUNvbXBvc2VyX0F1dG9Db21wbGV0ZVdyYXBwZXJcIj5cbiAgICAgICAgICAgICAgICA8QXV0b2NvbXBsZXRlXG4gICAgICAgICAgICAgICAgICAgIHJlZj17cmVmID0+IHRoaXMuX2F1dG9jb21wbGV0ZVJlZiA9IHJlZn1cbiAgICAgICAgICAgICAgICAgICAgcXVlcnk9e3F1ZXJ5fVxuICAgICAgICAgICAgICAgICAgICBvbkNvbmZpcm09e3RoaXMuX29uQXV0b0NvbXBsZXRlQ29uZmlybX1cbiAgICAgICAgICAgICAgICAgICAgb25TZWxlY3Rpb25DaGFuZ2U9e3RoaXMuX29uQXV0b0NvbXBsZXRlU2VsZWN0aW9uQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb249e3tiZWdpbm5pbmc6IHRydWUsIGVuZDogcXVlcnlMZW4sIHN0YXJ0OiBxdWVyeUxlbn19XG4gICAgICAgICAgICAgICAgICAgIHJvb209e3RoaXMucHJvcHMucm9vbX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB3cmFwcGVyQ2xhc3NlcyA9IGNsYXNzTmFtZXMoXCJteF9CYXNpY01lc3NhZ2VDb21wb3NlclwiLCB7XG4gICAgICAgICAgICBcIm14X0Jhc2ljTWVzc2FnZUNvbXBvc2VyX2lucHV0X2Vycm9yXCI6IHRoaXMuc3RhdGUuc2hvd1Zpc3VhbEJlbGwsXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBjbGFzc2VzID0gY2xhc3NOYW1lcyhcIm14X0Jhc2ljTWVzc2FnZUNvbXBvc2VyX2lucHV0XCIsIHtcbiAgICAgICAgICAgIFwibXhfQmFzaWNNZXNzYWdlQ29tcG9zZXJfaW5wdXRfc2hvdWxkU2hvd1BpbGxBdmF0YXJcIjogdGhpcy5zdGF0ZS5zaG93UGlsbEF2YXRhcixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgTWVzc2FnZUNvbXBvc2VyRm9ybWF0QmFyID0gc2RrLmdldENvbXBvbmVudCgncm9vbXMuTWVzc2FnZUNvbXBvc2VyRm9ybWF0QmFyJyk7XG4gICAgICAgIGNvbnN0IHNob3J0Y3V0cyA9IHtcbiAgICAgICAgICAgIGJvbGQ6IGN0cmxTaG9ydGN1dExhYmVsKFwiQlwiKSxcbiAgICAgICAgICAgIGl0YWxpY3M6IGN0cmxTaG9ydGN1dExhYmVsKFwiSVwiKSxcbiAgICAgICAgICAgIHF1b3RlOiBjdHJsU2hvcnRjdXRMYWJlbChcIj5cIiksXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qge2NvbXBsZXRpb25JbmRleH0gPSB0aGlzLnN0YXRlO1xuXG4gICAgICAgIHJldHVybiAoPGRpdiBjbGFzc05hbWU9e3dyYXBwZXJDbGFzc2VzfT5cbiAgICAgICAgICAgIHsgYXV0b0NvbXBsZXRlIH1cbiAgICAgICAgICAgIDxNZXNzYWdlQ29tcG9zZXJGb3JtYXRCYXIgcmVmPXtyZWYgPT4gdGhpcy5fZm9ybWF0QmFyUmVmID0gcmVmfSBvbkFjdGlvbj17dGhpcy5fb25Gb3JtYXRBY3Rpb259IHNob3J0Y3V0cz17c2hvcnRjdXRzfSAvPlxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3Nlc31cbiAgICAgICAgICAgICAgICBjb250ZW50RWRpdGFibGU9XCJ0cnVlXCJcbiAgICAgICAgICAgICAgICB0YWJJbmRleD1cIjBcIlxuICAgICAgICAgICAgICAgIG9uQmx1cj17dGhpcy5fb25CbHVyfVxuICAgICAgICAgICAgICAgIG9uRm9jdXM9e3RoaXMuX29uRm9jdXN9XG4gICAgICAgICAgICAgICAgb25Db3B5PXt0aGlzLl9vbkNvcHl9XG4gICAgICAgICAgICAgICAgb25DdXQ9e3RoaXMuX29uQ3V0fVxuICAgICAgICAgICAgICAgIG9uUGFzdGU9e3RoaXMuX29uUGFzdGV9XG4gICAgICAgICAgICAgICAgb25LZXlEb3duPXt0aGlzLl9vbktleURvd259XG4gICAgICAgICAgICAgICAgcmVmPXtyZWYgPT4gdGhpcy5fZWRpdG9yUmVmID0gcmVmfVxuICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9e3RoaXMucHJvcHMubGFiZWx9XG4gICAgICAgICAgICAgICAgcm9sZT1cInRleHRib3hcIlxuICAgICAgICAgICAgICAgIGFyaWEtbXVsdGlsaW5lPVwidHJ1ZVwiXG4gICAgICAgICAgICAgICAgYXJpYS1hdXRvY29tcGxldGU9XCJib3RoXCJcbiAgICAgICAgICAgICAgICBhcmlhLWhhc3BvcHVwPVwibGlzdGJveFwiXG4gICAgICAgICAgICAgICAgYXJpYS1leHBhbmRlZD17Qm9vbGVhbih0aGlzLnN0YXRlLmF1dG9Db21wbGV0ZSl9XG4gICAgICAgICAgICAgICAgYXJpYS1hY3RpdmVkZXNjZW5kYW50PXtjb21wbGV0aW9uSW5kZXggPj0gMCA/IGdlbmVyYXRlQ29tcGxldGlvbkRvbUlkKGNvbXBsZXRpb25JbmRleCkgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgZGlyPVwiYXV0b1wiXG4gICAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj4pO1xuICAgIH1cblxuICAgIGZvY3VzKCkge1xuICAgICAgICB0aGlzLl9lZGl0b3JSZWYuZm9jdXMoKTtcbiAgICB9XG59XG4iXX0=