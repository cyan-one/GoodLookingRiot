"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMessageContent = createMessageContent;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _model = _interopRequireDefault(require("../../../editor/model"));

var _serialize = require("../../../editor/serialize");

var _parts = require("../../../editor/parts");

var _BasicMessageComposer = _interopRequireDefault(require("./BasicMessageComposer"));

var _ReplyPreview = _interopRequireDefault(require("./ReplyPreview"));

var _RoomViewStore = _interopRequireDefault(require("../../../stores/RoomViewStore"));

var _ReplyThread = _interopRequireDefault(require("../elements/ReplyThread"));

var _deserialize = require("../../../editor/deserialize");

var _EventUtils = require("../../../utils/EventUtils");

var _SendHistoryManager = _interopRequireDefault(require("../../../SendHistoryManager"));

var _SlashCommands = require("../../../SlashCommands");

var sdk = _interopRequireWildcard(require("../../../index"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _languageHandler = require("../../../languageHandler");

var _ContentMessages = _interopRequireDefault(require("../../../ContentMessages"));

var _Keyboard = require("../../../Keyboard");

var _MatrixClientContext = _interopRequireDefault(require("../../../contexts/MatrixClientContext"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _ratelimitedfunc = _interopRequireDefault(require("../../../ratelimitedfunc"));

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
function addReplyToMessageContent(content, repliedToEvent, permalinkCreator) {
  const replyContent = _ReplyThread.default.makeReplyMixIn(repliedToEvent);

  Object.assign(content, replyContent); // Part of Replies fallback support - prepend the text we're sending
  // with the text we're replying to

  const nestedReply = _ReplyThread.default.getNestedReplyText(repliedToEvent, permalinkCreator);

  if (nestedReply) {
    if (content.formatted_body) {
      content.formatted_body = nestedReply.html + content.formatted_body;
    }

    content.body = nestedReply.body + content.body;
  }
} // exported for tests


function createMessageContent(model, permalinkCreator) {
  const isEmote = (0, _serialize.containsEmote)(model);

  if (isEmote) {
    model = (0, _serialize.stripEmoteCommand)(model);
  }

  if ((0, _serialize.startsWith)(model, "//")) {
    model = (0, _serialize.stripPrefix)(model, "/");
  }

  model = (0, _serialize.unescapeMessage)(model);

  const repliedToEvent = _RoomViewStore.default.getQuotingEvent();

  const body = (0, _serialize.textSerialize)(model);
  const content = {
    msgtype: isEmote ? "m.emote" : "m.text",
    body: body
  };
  const formattedBody = (0, _serialize.htmlSerializeIfNeeded)(model, {
    forceHTML: !!repliedToEvent
  });

  if (formattedBody) {
    content.format = "org.matrix.custom.html";
    content.formatted_body = formattedBody;
  }

  if (repliedToEvent) {
    addReplyToMessageContent(content, repliedToEvent, permalinkCreator);
  }

  return content;
}

class SendMessageComposer extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_setEditorRef", ref => {
      this._editorRef = ref;
    });
    (0, _defineProperty2.default)(this, "_onKeyDown", event => {
      // ignore any keypress while doing IME compositions
      if (this._editorRef.isComposing(event)) {
        return;
      }

      const hasModifier = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

      if (event.key === _Keyboard.Key.ENTER && !hasModifier) {
        this._sendMessage();

        event.preventDefault();
      } else if (event.key === _Keyboard.Key.ARROW_UP) {
        this.onVerticalArrow(event, true);
      } else if (event.key === _Keyboard.Key.ARROW_DOWN) {
        this.onVerticalArrow(event, false);
      } else if (this._prepareToEncrypt) {
        this._prepareToEncrypt();
      } else if (event.key === _Keyboard.Key.ESCAPE) {
        _dispatcher.default.dispatch({
          action: 'reply_to_event',
          event: null
        });
      }
    });
    (0, _defineProperty2.default)(this, "_saveStoredEditorState", () => {
      if (this.model.isEmpty) {
        this._clearStoredEditorState();
      } else {
        localStorage.setItem(this._editorStateKey, JSON.stringify(this.model.serializeParts()));
      }
    });
    (0, _defineProperty2.default)(this, "onAction", payload => {
      switch (payload.action) {
        case 'reply_to_event':
        case 'focus_composer':
          this._editorRef && this._editorRef.focus();
          break;

        case 'insert_mention':
          this._insertMention(payload.user_id);

          break;

        case 'quote':
          this._insertQuotedMessage(payload.event);

          break;
      }
    });
    (0, _defineProperty2.default)(this, "_onPaste", event => {
      const {
        clipboardData
      } = event;

      if (clipboardData.files.length) {
        // This actually not so much for 'files' as such (at time of writing
        // neither chrome nor firefox let you paste a plain file copied
        // from Finder) but more images copied from a different website
        // / word processor etc.
        _ContentMessages.default.sharedInstance().sendContentListToRoom(Array.from(clipboardData.files), this.props.room.roomId, this.context);
      }
    });
    this.model = null;
    this._editorRef = null;
    this.currentlyComposedEditorState = null;

    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    if (cli.isCryptoEnabled() && cli.isRoomEncrypted(this.props.room.roomId)) {
      this._prepareToEncrypt = new _ratelimitedfunc.default(() => {
        cli.prepareToEncrypt(this.props.room);
      }, 60000);
    }
  }

  onVerticalArrow(e, up) {
    // arrows from an initial-caret composer navigates recent messages to edit
    // ctrl-alt-arrows navigate send history
    if (e.shiftKey || e.metaKey) return;
    const shouldSelectHistory = e.altKey && e.ctrlKey;
    const shouldEditLastMessage = !e.altKey && !e.ctrlKey && up && !_RoomViewStore.default.getQuotingEvent();

    if (shouldSelectHistory) {
      // Try select composer history
      const selected = this.selectSendHistory(up);

      if (selected) {
        // We're selecting history, so prevent the key event from doing anything else
        e.preventDefault();
      }
    } else if (shouldEditLastMessage) {
      // selection must be collapsed and caret at start
      if (this._editorRef.isSelectionCollapsed() && this._editorRef.isCaretAtStart()) {
        const editEvent = (0, _EventUtils.findEditableEvent)(this.props.room, false);

        if (editEvent) {
          // We're selecting history, so prevent the key event from doing anything else
          e.preventDefault();

          _dispatcher.default.dispatch({
            action: 'edit_event',
            event: editEvent
          });
        }
      }
    }
  } // we keep sent messages/commands in a separate history (separate from undo history)
  // so you can alt+up/down in them


  selectSendHistory(up) {
    const delta = up ? -1 : 1; // True if we are not currently selecting history, but composing a message

    if (this.sendHistoryManager.currentIndex === this.sendHistoryManager.history.length) {
      // We can't go any further - there isn't any more history, so nop.
      if (!up) {
        return;
      }

      this.currentlyComposedEditorState = this.model.serializeParts();
    } else if (this.sendHistoryManager.currentIndex + delta === this.sendHistoryManager.history.length) {
      // True when we return to the message being composed currently
      this.model.reset(this.currentlyComposedEditorState);
      this.sendHistoryManager.currentIndex = this.sendHistoryManager.history.length;
      return;
    }

    const serializedParts = this.sendHistoryManager.getItem(delta);

    if (serializedParts) {
      this.model.reset(serializedParts);

      this._editorRef.focus();
    }
  }

  _isSlashCommand() {
    const parts = this.model.parts;
    const firstPart = parts[0];

    if (firstPart) {
      if (firstPart.type === "command" && firstPart.text.startsWith("/") && !firstPart.text.startsWith("//")) {
        return true;
      } // be extra resilient when somehow the AutocompleteWrapperModel or
      // CommandPartCreator fails to insert a command part, so we don't send
      // a command as a message


      if (firstPart.text.startsWith("/") && !firstPart.text.startsWith("//") && (firstPart.type === "plain" || firstPart.type === "pill-candidate")) {
        return true;
      }
    }

    return false;
  }

  _getSlashCommand() {
    const commandText = this.model.parts.reduce((text, part) => {
      // use mxid to textify user pills in a command
      if (part.type === "user-pill") {
        return text + part.resourceId;
      }

      return text + part.text;
    }, "");
    return [(0, _SlashCommands.getCommand)(this.props.room.roomId, commandText), commandText];
  }

  async _runSlashCommand(fn) {
    const cmd = fn();
    let error = cmd.error;

    if (cmd.promise) {
      try {
        await cmd.promise;
      } catch (err) {
        error = err;
      }
    }

    if (error) {
      console.error("Command failure: %s", error);
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog"); // assume the error is a server error when the command is async

      const isServerError = !!cmd.promise;
      const title = isServerError ? (0, _languageHandler._td)("Server error") : (0, _languageHandler._td)("Command error");
      let errText;

      if (typeof error === 'string') {
        errText = error;
      } else if (error.message) {
        errText = error.message;
      } else {
        errText = (0, _languageHandler._t)("Server unavailable, overloaded, or something else went wrong.");
      }

      _Modal.default.createTrackedDialog(title, '', ErrorDialog, {
        title: (0, _languageHandler._t)(title),
        description: errText
      });
    } else {
      console.log("Command success.");
    }
  }

  async _sendMessage() {
    if (this.model.isEmpty) {
      return;
    }

    let shouldSend = true;

    if (!(0, _serialize.containsEmote)(this.model) && this._isSlashCommand()) {
      const [cmd, commandText] = this._getSlashCommand();

      if (cmd) {
        shouldSend = false;

        this._runSlashCommand(cmd);
      } else {
        // ask the user if their unknown command should be sent as a message
        const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");

        const {
          finished
        } = _Modal.default.createTrackedDialog("Unknown command", "", QuestionDialog, {
          title: (0, _languageHandler._t)("Unknown Command"),
          description: /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Unrecognised command: %(commandText)s", {
            commandText
          })), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("You can use <code>/help</code> to list available commands. " + "Did you mean to send this as a message?", {}, {
            code: t => /*#__PURE__*/_react.default.createElement("code", null, t)
          })), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Hint: Begin your message with <code>//</code> to start it with a slash.", {}, {
            code: t => /*#__PURE__*/_react.default.createElement("code", null, t)
          }))),
          button: (0, _languageHandler._t)('Send as message')
        });

        const [sendAnyway] = await finished; // if !sendAnyway bail to let the user edit the composer and try again

        if (!sendAnyway) return;
      }
    }

    if (shouldSend) {
      const isReply = !!_RoomViewStore.default.getQuotingEvent();
      const {
        roomId
      } = this.props.room;
      const content = createMessageContent(this.model, this.props.permalinkCreator);
      this.context.sendMessage(roomId, content);

      if (isReply) {
        // Clear reply_to_event as we put the message into the queue
        // if the send fails, retry will handle resending.
        _dispatcher.default.dispatch({
          action: 'reply_to_event',
          event: null
        });
      }
    }

    this.sendHistoryManager.save(this.model); // clear composer

    this.model.reset([]);

    this._editorRef.clearUndoHistory();

    this._editorRef.focus();

    this._clearStoredEditorState();
  }

  componentDidMount() {
    this._editorRef.getEditableRootNode().addEventListener("paste", this._onPaste, true);
  }

  componentWillUnmount() {
    _dispatcher.default.unregister(this.dispatcherRef);

    this._editorRef.getEditableRootNode().removeEventListener("paste", this._onPaste, true);
  } // TODO: [REACT-WARNING] Move this to constructor


  UNSAFE_componentWillMount() {
    // eslint-disable-line camelcase
    const partCreator = new _parts.CommandPartCreator(this.props.room, this.context);
    const parts = this._restoreStoredEditorState(partCreator) || [];
    this.model = new _model.default(parts, partCreator);
    this.dispatcherRef = _dispatcher.default.register(this.onAction);
    this.sendHistoryManager = new _SendHistoryManager.default(this.props.room.roomId, 'mx_cider_composer_history_');
  }

  get _editorStateKey() {
    return "cider_editor_state_".concat(this.props.room.roomId);
  }

  _clearStoredEditorState() {
    localStorage.removeItem(this._editorStateKey);
  }

  _restoreStoredEditorState(partCreator) {
    const json = localStorage.getItem(this._editorStateKey);

    if (json) {
      const serializedParts = JSON.parse(json);
      const parts = serializedParts.map(p => partCreator.deserializePart(p));
      return parts;
    }
  }

  _insertMention(userId) {
    const {
      model
    } = this;
    const {
      partCreator
    } = model;
    const member = this.props.room.getMember(userId);
    const displayName = member ? member.rawDisplayName : userId;

    const caret = this._editorRef.getCaret();

    const position = model.positionForOffset(caret.offset, caret.atNodeEnd); // index is -1 if there are no parts but we only care for if this would be the part in position 0

    const insertIndex = position.index > 0 ? position.index : 0;
    const parts = partCreator.createMentionParts(insertIndex, displayName, userId);
    model.transform(() => {
      const addedLen = model.insert(parts, position);
      return model.positionForOffset(caret.offset + addedLen, true);
    }); // refocus on composer, as we just clicked "Mention"

    this._editorRef && this._editorRef.focus();
  }

  _insertQuotedMessage(event) {
    const {
      model
    } = this;
    const {
      partCreator
    } = model;
    const quoteParts = (0, _deserialize.parseEvent)(event, partCreator, {
      isQuotedMessage: true
    }); // add two newlines

    quoteParts.push(partCreator.newline());
    quoteParts.push(partCreator.newline());
    model.transform(() => {
      const addedLen = model.insert(quoteParts, model.positionForOffset(0));
      return model.positionForOffset(addedLen, true);
    }); // refocus on composer, as we just clicked "Quote"

    this._editorRef && this._editorRef.focus();
  }

  render() {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SendMessageComposer",
      onClick: this.focusComposer,
      onKeyDown: this._onKeyDown
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SendMessageComposer_overlayWrapper"
    }, /*#__PURE__*/_react.default.createElement(_ReplyPreview.default, {
      permalinkCreator: this.props.permalinkCreator
    })), /*#__PURE__*/_react.default.createElement(_BasicMessageComposer.default, {
      ref: this._setEditorRef,
      model: this.model,
      room: this.props.room,
      label: this.props.placeholder,
      placeholder: this.props.placeholder,
      onChange: this._saveStoredEditorState
    }));
  }

}

exports.default = SendMessageComposer;
(0, _defineProperty2.default)(SendMessageComposer, "propTypes", {
  room: _propTypes.default.object.isRequired,
  placeholder: _propTypes.default.string,
  permalinkCreator: _propTypes.default.object.isRequired
});
(0, _defineProperty2.default)(SendMessageComposer, "contextType", _MatrixClientContext.default);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL1NlbmRNZXNzYWdlQ29tcG9zZXIuanMiXSwibmFtZXMiOlsiYWRkUmVwbHlUb01lc3NhZ2VDb250ZW50IiwiY29udGVudCIsInJlcGxpZWRUb0V2ZW50IiwicGVybWFsaW5rQ3JlYXRvciIsInJlcGx5Q29udGVudCIsIlJlcGx5VGhyZWFkIiwibWFrZVJlcGx5TWl4SW4iLCJPYmplY3QiLCJhc3NpZ24iLCJuZXN0ZWRSZXBseSIsImdldE5lc3RlZFJlcGx5VGV4dCIsImZvcm1hdHRlZF9ib2R5IiwiaHRtbCIsImJvZHkiLCJjcmVhdGVNZXNzYWdlQ29udGVudCIsIm1vZGVsIiwiaXNFbW90ZSIsIlJvb21WaWV3U3RvcmUiLCJnZXRRdW90aW5nRXZlbnQiLCJtc2d0eXBlIiwiZm9ybWF0dGVkQm9keSIsImZvcmNlSFRNTCIsImZvcm1hdCIsIlNlbmRNZXNzYWdlQ29tcG9zZXIiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJyZWYiLCJfZWRpdG9yUmVmIiwiZXZlbnQiLCJpc0NvbXBvc2luZyIsImhhc01vZGlmaWVyIiwiYWx0S2V5IiwiY3RybEtleSIsIm1ldGFLZXkiLCJzaGlmdEtleSIsImtleSIsIktleSIsIkVOVEVSIiwiX3NlbmRNZXNzYWdlIiwicHJldmVudERlZmF1bHQiLCJBUlJPV19VUCIsIm9uVmVydGljYWxBcnJvdyIsIkFSUk9XX0RPV04iLCJfcHJlcGFyZVRvRW5jcnlwdCIsIkVTQ0FQRSIsImRpcyIsImRpc3BhdGNoIiwiYWN0aW9uIiwiaXNFbXB0eSIsIl9jbGVhclN0b3JlZEVkaXRvclN0YXRlIiwibG9jYWxTdG9yYWdlIiwic2V0SXRlbSIsIl9lZGl0b3JTdGF0ZUtleSIsIkpTT04iLCJzdHJpbmdpZnkiLCJzZXJpYWxpemVQYXJ0cyIsInBheWxvYWQiLCJmb2N1cyIsIl9pbnNlcnRNZW50aW9uIiwidXNlcl9pZCIsIl9pbnNlcnRRdW90ZWRNZXNzYWdlIiwiY2xpcGJvYXJkRGF0YSIsImZpbGVzIiwibGVuZ3RoIiwiQ29udGVudE1lc3NhZ2VzIiwic2hhcmVkSW5zdGFuY2UiLCJzZW5kQ29udGVudExpc3RUb1Jvb20iLCJBcnJheSIsImZyb20iLCJyb29tIiwicm9vbUlkIiwiY29udGV4dCIsImN1cnJlbnRseUNvbXBvc2VkRWRpdG9yU3RhdGUiLCJjbGkiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJpc0NyeXB0b0VuYWJsZWQiLCJpc1Jvb21FbmNyeXB0ZWQiLCJSYXRlTGltaXRlZEZ1bmMiLCJwcmVwYXJlVG9FbmNyeXB0IiwiZSIsInVwIiwic2hvdWxkU2VsZWN0SGlzdG9yeSIsInNob3VsZEVkaXRMYXN0TWVzc2FnZSIsInNlbGVjdGVkIiwic2VsZWN0U2VuZEhpc3RvcnkiLCJpc1NlbGVjdGlvbkNvbGxhcHNlZCIsImlzQ2FyZXRBdFN0YXJ0IiwiZWRpdEV2ZW50IiwiZGVsdGEiLCJzZW5kSGlzdG9yeU1hbmFnZXIiLCJjdXJyZW50SW5kZXgiLCJoaXN0b3J5IiwicmVzZXQiLCJzZXJpYWxpemVkUGFydHMiLCJnZXRJdGVtIiwiX2lzU2xhc2hDb21tYW5kIiwicGFydHMiLCJmaXJzdFBhcnQiLCJ0eXBlIiwidGV4dCIsInN0YXJ0c1dpdGgiLCJfZ2V0U2xhc2hDb21tYW5kIiwiY29tbWFuZFRleHQiLCJyZWR1Y2UiLCJwYXJ0IiwicmVzb3VyY2VJZCIsIl9ydW5TbGFzaENvbW1hbmQiLCJmbiIsImNtZCIsImVycm9yIiwicHJvbWlzZSIsImVyciIsImNvbnNvbGUiLCJFcnJvckRpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsImlzU2VydmVyRXJyb3IiLCJ0aXRsZSIsImVyclRleHQiLCJtZXNzYWdlIiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwiZGVzY3JpcHRpb24iLCJsb2ciLCJzaG91bGRTZW5kIiwiUXVlc3Rpb25EaWFsb2ciLCJmaW5pc2hlZCIsImNvZGUiLCJ0IiwiYnV0dG9uIiwic2VuZEFueXdheSIsImlzUmVwbHkiLCJzZW5kTWVzc2FnZSIsInNhdmUiLCJjbGVhclVuZG9IaXN0b3J5IiwiY29tcG9uZW50RGlkTW91bnQiLCJnZXRFZGl0YWJsZVJvb3ROb2RlIiwiYWRkRXZlbnRMaXN0ZW5lciIsIl9vblBhc3RlIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJ1bnJlZ2lzdGVyIiwiZGlzcGF0Y2hlclJlZiIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50IiwicGFydENyZWF0b3IiLCJDb21tYW5kUGFydENyZWF0b3IiLCJfcmVzdG9yZVN0b3JlZEVkaXRvclN0YXRlIiwiRWRpdG9yTW9kZWwiLCJyZWdpc3RlciIsIm9uQWN0aW9uIiwiU2VuZEhpc3RvcnlNYW5hZ2VyIiwicmVtb3ZlSXRlbSIsImpzb24iLCJwYXJzZSIsIm1hcCIsInAiLCJkZXNlcmlhbGl6ZVBhcnQiLCJ1c2VySWQiLCJtZW1iZXIiLCJnZXRNZW1iZXIiLCJkaXNwbGF5TmFtZSIsInJhd0Rpc3BsYXlOYW1lIiwiY2FyZXQiLCJnZXRDYXJldCIsInBvc2l0aW9uIiwicG9zaXRpb25Gb3JPZmZzZXQiLCJvZmZzZXQiLCJhdE5vZGVFbmQiLCJpbnNlcnRJbmRleCIsImluZGV4IiwiY3JlYXRlTWVudGlvblBhcnRzIiwidHJhbnNmb3JtIiwiYWRkZWRMZW4iLCJpbnNlcnQiLCJxdW90ZVBhcnRzIiwiaXNRdW90ZWRNZXNzYWdlIiwicHVzaCIsIm5ld2xpbmUiLCJyZW5kZXIiLCJmb2N1c0NvbXBvc2VyIiwiX29uS2V5RG93biIsIl9zZXRFZGl0b3JSZWYiLCJwbGFjZWhvbGRlciIsIl9zYXZlU3RvcmVkRWRpdG9yU3RhdGUiLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJpc1JlcXVpcmVkIiwic3RyaW5nIiwiTWF0cml4Q2xpZW50Q29udGV4dCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBU0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FB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QUFBQSxJQUFJLEVBQUVvSCxtQkFBVUMsTUFBVixDQUFpQkMsVUFEUjtBQUVmSixFQUFBQSxXQUFXLEVBQUVFLG1CQUFVRyxNQUZSO0FBR2YzTCxFQUFBQSxnQkFBZ0IsRUFBRXdMLG1CQUFVQyxNQUFWLENBQWlCQztBQUhwQixDOzhCQURGdEssbUIsaUJBT0l3Syw0QiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgZGlzIGZyb20gJy4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgRWRpdG9yTW9kZWwgZnJvbSAnLi4vLi4vLi4vZWRpdG9yL21vZGVsJztcbmltcG9ydCB7XG4gICAgaHRtbFNlcmlhbGl6ZUlmTmVlZGVkLFxuICAgIHRleHRTZXJpYWxpemUsXG4gICAgY29udGFpbnNFbW90ZSxcbiAgICBzdHJpcEVtb3RlQ29tbWFuZCxcbiAgICB1bmVzY2FwZU1lc3NhZ2UsXG4gICAgc3RhcnRzV2l0aCxcbiAgICBzdHJpcFByZWZpeCxcbn0gZnJvbSAnLi4vLi4vLi4vZWRpdG9yL3NlcmlhbGl6ZSc7XG5pbXBvcnQge0NvbW1hbmRQYXJ0Q3JlYXRvcn0gZnJvbSAnLi4vLi4vLi4vZWRpdG9yL3BhcnRzJztcbmltcG9ydCBCYXNpY01lc3NhZ2VDb21wb3NlciBmcm9tIFwiLi9CYXNpY01lc3NhZ2VDb21wb3NlclwiO1xuaW1wb3J0IFJlcGx5UHJldmlldyBmcm9tIFwiLi9SZXBseVByZXZpZXdcIjtcbmltcG9ydCBSb29tVmlld1N0b3JlIGZyb20gJy4uLy4uLy4uL3N0b3Jlcy9Sb29tVmlld1N0b3JlJztcbmltcG9ydCBSZXBseVRocmVhZCBmcm9tIFwiLi4vZWxlbWVudHMvUmVwbHlUaHJlYWRcIjtcbmltcG9ydCB7cGFyc2VFdmVudH0gZnJvbSAnLi4vLi4vLi4vZWRpdG9yL2Rlc2VyaWFsaXplJztcbmltcG9ydCB7ZmluZEVkaXRhYmxlRXZlbnR9IGZyb20gJy4uLy4uLy4uL3V0aWxzL0V2ZW50VXRpbHMnO1xuaW1wb3J0IFNlbmRIaXN0b3J5TWFuYWdlciBmcm9tIFwiLi4vLi4vLi4vU2VuZEhpc3RvcnlNYW5hZ2VyXCI7XG5pbXBvcnQge2dldENvbW1hbmR9IGZyb20gJy4uLy4uLy4uL1NsYXNoQ29tbWFuZHMnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCBNb2RhbCBmcm9tICcuLi8uLi8uLi9Nb2RhbCc7XG5pbXBvcnQge190LCBfdGR9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgQ29udGVudE1lc3NhZ2VzIGZyb20gJy4uLy4uLy4uL0NvbnRlbnRNZXNzYWdlcyc7XG5pbXBvcnQge0tleX0gZnJvbSBcIi4uLy4uLy4uL0tleWJvYXJkXCI7XG5pbXBvcnQgTWF0cml4Q2xpZW50Q29udGV4dCBmcm9tIFwiLi4vLi4vLi4vY29udGV4dHMvTWF0cml4Q2xpZW50Q29udGV4dFwiO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCBSYXRlTGltaXRlZEZ1bmMgZnJvbSAnLi4vLi4vLi4vcmF0ZWxpbWl0ZWRmdW5jJztcblxuZnVuY3Rpb24gYWRkUmVwbHlUb01lc3NhZ2VDb250ZW50KGNvbnRlbnQsIHJlcGxpZWRUb0V2ZW50LCBwZXJtYWxpbmtDcmVhdG9yKSB7XG4gICAgY29uc3QgcmVwbHlDb250ZW50ID0gUmVwbHlUaHJlYWQubWFrZVJlcGx5TWl4SW4ocmVwbGllZFRvRXZlbnQpO1xuICAgIE9iamVjdC5hc3NpZ24oY29udGVudCwgcmVwbHlDb250ZW50KTtcblxuICAgIC8vIFBhcnQgb2YgUmVwbGllcyBmYWxsYmFjayBzdXBwb3J0IC0gcHJlcGVuZCB0aGUgdGV4dCB3ZSdyZSBzZW5kaW5nXG4gICAgLy8gd2l0aCB0aGUgdGV4dCB3ZSdyZSByZXBseWluZyB0b1xuICAgIGNvbnN0IG5lc3RlZFJlcGx5ID0gUmVwbHlUaHJlYWQuZ2V0TmVzdGVkUmVwbHlUZXh0KHJlcGxpZWRUb0V2ZW50LCBwZXJtYWxpbmtDcmVhdG9yKTtcbiAgICBpZiAobmVzdGVkUmVwbHkpIHtcbiAgICAgICAgaWYgKGNvbnRlbnQuZm9ybWF0dGVkX2JvZHkpIHtcbiAgICAgICAgICAgIGNvbnRlbnQuZm9ybWF0dGVkX2JvZHkgPSBuZXN0ZWRSZXBseS5odG1sICsgY29udGVudC5mb3JtYXR0ZWRfYm9keTtcbiAgICAgICAgfVxuICAgICAgICBjb250ZW50LmJvZHkgPSBuZXN0ZWRSZXBseS5ib2R5ICsgY29udGVudC5ib2R5O1xuICAgIH1cbn1cblxuLy8gZXhwb3J0ZWQgZm9yIHRlc3RzXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTWVzc2FnZUNvbnRlbnQobW9kZWwsIHBlcm1hbGlua0NyZWF0b3IpIHtcbiAgICBjb25zdCBpc0Vtb3RlID0gY29udGFpbnNFbW90ZShtb2RlbCk7XG4gICAgaWYgKGlzRW1vdGUpIHtcbiAgICAgICAgbW9kZWwgPSBzdHJpcEVtb3RlQ29tbWFuZChtb2RlbCk7XG4gICAgfVxuICAgIGlmIChzdGFydHNXaXRoKG1vZGVsLCBcIi8vXCIpKSB7XG4gICAgICAgIG1vZGVsID0gc3RyaXBQcmVmaXgobW9kZWwsIFwiL1wiKTtcbiAgICB9XG4gICAgbW9kZWwgPSB1bmVzY2FwZU1lc3NhZ2UobW9kZWwpO1xuICAgIGNvbnN0IHJlcGxpZWRUb0V2ZW50ID0gUm9vbVZpZXdTdG9yZS5nZXRRdW90aW5nRXZlbnQoKTtcblxuICAgIGNvbnN0IGJvZHkgPSB0ZXh0U2VyaWFsaXplKG1vZGVsKTtcbiAgICBjb25zdCBjb250ZW50ID0ge1xuICAgICAgICBtc2d0eXBlOiBpc0Vtb3RlID8gXCJtLmVtb3RlXCIgOiBcIm0udGV4dFwiLFxuICAgICAgICBib2R5OiBib2R5LFxuICAgIH07XG4gICAgY29uc3QgZm9ybWF0dGVkQm9keSA9IGh0bWxTZXJpYWxpemVJZk5lZWRlZChtb2RlbCwge2ZvcmNlSFRNTDogISFyZXBsaWVkVG9FdmVudH0pO1xuICAgIGlmIChmb3JtYXR0ZWRCb2R5KSB7XG4gICAgICAgIGNvbnRlbnQuZm9ybWF0ID0gXCJvcmcubWF0cml4LmN1c3RvbS5odG1sXCI7XG4gICAgICAgIGNvbnRlbnQuZm9ybWF0dGVkX2JvZHkgPSBmb3JtYXR0ZWRCb2R5O1xuICAgIH1cblxuICAgIGlmIChyZXBsaWVkVG9FdmVudCkge1xuICAgICAgICBhZGRSZXBseVRvTWVzc2FnZUNvbnRlbnQoY29udGVudCwgcmVwbGllZFRvRXZlbnQsIHBlcm1hbGlua0NyZWF0b3IpO1xuICAgIH1cblxuICAgIHJldHVybiBjb250ZW50O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZW5kTWVzc2FnZUNvbXBvc2VyIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICByb29tOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICAgIHBsYWNlaG9sZGVyOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICBwZXJtYWxpbmtDcmVhdG9yOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIHN0YXRpYyBjb250ZXh0VHlwZSA9IE1hdHJpeENsaWVudENvbnRleHQ7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG4gICAgICAgIHRoaXMubW9kZWwgPSBudWxsO1xuICAgICAgICB0aGlzLl9lZGl0b3JSZWYgPSBudWxsO1xuICAgICAgICB0aGlzLmN1cnJlbnRseUNvbXBvc2VkRWRpdG9yU3RhdGUgPSBudWxsO1xuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGlmIChjbGkuaXNDcnlwdG9FbmFibGVkKCkgJiYgY2xpLmlzUm9vbUVuY3J5cHRlZCh0aGlzLnByb3BzLnJvb20ucm9vbUlkKSkge1xuICAgICAgICAgICAgdGhpcy5fcHJlcGFyZVRvRW5jcnlwdCA9IG5ldyBSYXRlTGltaXRlZEZ1bmMoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNsaS5wcmVwYXJlVG9FbmNyeXB0KHRoaXMucHJvcHMucm9vbSk7XG4gICAgICAgICAgICB9LCA2MDAwMCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfc2V0RWRpdG9yUmVmID0gcmVmID0+IHtcbiAgICAgICAgdGhpcy5fZWRpdG9yUmVmID0gcmVmO1xuICAgIH07XG5cbiAgICBfb25LZXlEb3duID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIC8vIGlnbm9yZSBhbnkga2V5cHJlc3Mgd2hpbGUgZG9pbmcgSU1FIGNvbXBvc2l0aW9uc1xuICAgICAgICBpZiAodGhpcy5fZWRpdG9yUmVmLmlzQ29tcG9zaW5nKGV2ZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGhhc01vZGlmaWVyID0gZXZlbnQuYWx0S2V5IHx8IGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQubWV0YUtleSB8fCBldmVudC5zaGlmdEtleTtcbiAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gS2V5LkVOVEVSICYmICFoYXNNb2RpZmllcikge1xuICAgICAgICAgICAgdGhpcy5fc2VuZE1lc3NhZ2UoKTtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnQua2V5ID09PSBLZXkuQVJST1dfVVApIHtcbiAgICAgICAgICAgIHRoaXMub25WZXJ0aWNhbEFycm93KGV2ZW50LCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC5rZXkgPT09IEtleS5BUlJPV19ET1dOKSB7XG4gICAgICAgICAgICB0aGlzLm9uVmVydGljYWxBcnJvdyhldmVudCwgZmFsc2UpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX3ByZXBhcmVUb0VuY3J5cHQpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZXBhcmVUb0VuY3J5cHQoKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC5rZXkgPT09IEtleS5FU0NBUEUpIHtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAncmVwbHlfdG9fZXZlbnQnLFxuICAgICAgICAgICAgICAgIGV2ZW50OiBudWxsLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgb25WZXJ0aWNhbEFycm93KGUsIHVwKSB7XG4gICAgICAgIC8vIGFycm93cyBmcm9tIGFuIGluaXRpYWwtY2FyZXQgY29tcG9zZXIgbmF2aWdhdGVzIHJlY2VudCBtZXNzYWdlcyB0byBlZGl0XG4gICAgICAgIC8vIGN0cmwtYWx0LWFycm93cyBuYXZpZ2F0ZSBzZW5kIGhpc3RvcnlcbiAgICAgICAgaWYgKGUuc2hpZnRLZXkgfHwgZS5tZXRhS2V5KSByZXR1cm47XG5cbiAgICAgICAgY29uc3Qgc2hvdWxkU2VsZWN0SGlzdG9yeSA9IGUuYWx0S2V5ICYmIGUuY3RybEtleTtcbiAgICAgICAgY29uc3Qgc2hvdWxkRWRpdExhc3RNZXNzYWdlID0gIWUuYWx0S2V5ICYmICFlLmN0cmxLZXkgJiYgdXAgJiYgIVJvb21WaWV3U3RvcmUuZ2V0UXVvdGluZ0V2ZW50KCk7XG5cbiAgICAgICAgaWYgKHNob3VsZFNlbGVjdEhpc3RvcnkpIHtcbiAgICAgICAgICAgIC8vIFRyeSBzZWxlY3QgY29tcG9zZXIgaGlzdG9yeVxuICAgICAgICAgICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdFNlbmRIaXN0b3J5KHVwKTtcbiAgICAgICAgICAgIGlmIChzZWxlY3RlZCkge1xuICAgICAgICAgICAgICAgIC8vIFdlJ3JlIHNlbGVjdGluZyBoaXN0b3J5LCBzbyBwcmV2ZW50IHRoZSBrZXkgZXZlbnQgZnJvbSBkb2luZyBhbnl0aGluZyBlbHNlXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHNob3VsZEVkaXRMYXN0TWVzc2FnZSkge1xuICAgICAgICAgICAgLy8gc2VsZWN0aW9uIG11c3QgYmUgY29sbGFwc2VkIGFuZCBjYXJldCBhdCBzdGFydFxuICAgICAgICAgICAgaWYgKHRoaXMuX2VkaXRvclJlZi5pc1NlbGVjdGlvbkNvbGxhcHNlZCgpICYmIHRoaXMuX2VkaXRvclJlZi5pc0NhcmV0QXRTdGFydCgpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZWRpdEV2ZW50ID0gZmluZEVkaXRhYmxlRXZlbnQodGhpcy5wcm9wcy5yb29tLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgaWYgKGVkaXRFdmVudCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSdyZSBzZWxlY3RpbmcgaGlzdG9yeSwgc28gcHJldmVudCB0aGUga2V5IGV2ZW50IGZyb20gZG9pbmcgYW55dGhpbmcgZWxzZVxuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdlZGl0X2V2ZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50OiBlZGl0RXZlbnQsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHdlIGtlZXAgc2VudCBtZXNzYWdlcy9jb21tYW5kcyBpbiBhIHNlcGFyYXRlIGhpc3RvcnkgKHNlcGFyYXRlIGZyb20gdW5kbyBoaXN0b3J5KVxuICAgIC8vIHNvIHlvdSBjYW4gYWx0K3VwL2Rvd24gaW4gdGhlbVxuICAgIHNlbGVjdFNlbmRIaXN0b3J5KHVwKSB7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gdXAgPyAtMSA6IDE7XG4gICAgICAgIC8vIFRydWUgaWYgd2UgYXJlIG5vdCBjdXJyZW50bHkgc2VsZWN0aW5nIGhpc3RvcnksIGJ1dCBjb21wb3NpbmcgYSBtZXNzYWdlXG4gICAgICAgIGlmICh0aGlzLnNlbmRIaXN0b3J5TWFuYWdlci5jdXJyZW50SW5kZXggPT09IHRoaXMuc2VuZEhpc3RvcnlNYW5hZ2VyLmhpc3RvcnkubGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBXZSBjYW4ndCBnbyBhbnkgZnVydGhlciAtIHRoZXJlIGlzbid0IGFueSBtb3JlIGhpc3RvcnksIHNvIG5vcC5cbiAgICAgICAgICAgIGlmICghdXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRseUNvbXBvc2VkRWRpdG9yU3RhdGUgPSB0aGlzLm1vZGVsLnNlcmlhbGl6ZVBhcnRzKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zZW5kSGlzdG9yeU1hbmFnZXIuY3VycmVudEluZGV4ICsgZGVsdGEgPT09IHRoaXMuc2VuZEhpc3RvcnlNYW5hZ2VyLmhpc3RvcnkubGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBUcnVlIHdoZW4gd2UgcmV0dXJuIHRvIHRoZSBtZXNzYWdlIGJlaW5nIGNvbXBvc2VkIGN1cnJlbnRseVxuICAgICAgICAgICAgdGhpcy5tb2RlbC5yZXNldCh0aGlzLmN1cnJlbnRseUNvbXBvc2VkRWRpdG9yU3RhdGUpO1xuICAgICAgICAgICAgdGhpcy5zZW5kSGlzdG9yeU1hbmFnZXIuY3VycmVudEluZGV4ID0gdGhpcy5zZW5kSGlzdG9yeU1hbmFnZXIuaGlzdG9yeS5sZW5ndGg7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2VyaWFsaXplZFBhcnRzID0gdGhpcy5zZW5kSGlzdG9yeU1hbmFnZXIuZ2V0SXRlbShkZWx0YSk7XG4gICAgICAgIGlmIChzZXJpYWxpemVkUGFydHMpIHtcbiAgICAgICAgICAgIHRoaXMubW9kZWwucmVzZXQoc2VyaWFsaXplZFBhcnRzKTtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvclJlZi5mb2N1cygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2lzU2xhc2hDb21tYW5kKCkge1xuICAgICAgICBjb25zdCBwYXJ0cyA9IHRoaXMubW9kZWwucGFydHM7XG4gICAgICAgIGNvbnN0IGZpcnN0UGFydCA9IHBhcnRzWzBdO1xuICAgICAgICBpZiAoZmlyc3RQYXJ0KSB7XG4gICAgICAgICAgICBpZiAoZmlyc3RQYXJ0LnR5cGUgPT09IFwiY29tbWFuZFwiICYmIGZpcnN0UGFydC50ZXh0LnN0YXJ0c1dpdGgoXCIvXCIpICYmICFmaXJzdFBhcnQudGV4dC5zdGFydHNXaXRoKFwiLy9cIikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGJlIGV4dHJhIHJlc2lsaWVudCB3aGVuIHNvbWVob3cgdGhlIEF1dG9jb21wbGV0ZVdyYXBwZXJNb2RlbCBvclxuICAgICAgICAgICAgLy8gQ29tbWFuZFBhcnRDcmVhdG9yIGZhaWxzIHRvIGluc2VydCBhIGNvbW1hbmQgcGFydCwgc28gd2UgZG9uJ3Qgc2VuZFxuICAgICAgICAgICAgLy8gYSBjb21tYW5kIGFzIGEgbWVzc2FnZVxuICAgICAgICAgICAgaWYgKGZpcnN0UGFydC50ZXh0LnN0YXJ0c1dpdGgoXCIvXCIpICYmICFmaXJzdFBhcnQudGV4dC5zdGFydHNXaXRoKFwiLy9cIilcbiAgICAgICAgICAgICAgICAmJiAoZmlyc3RQYXJ0LnR5cGUgPT09IFwicGxhaW5cIiB8fCBmaXJzdFBhcnQudHlwZSA9PT0gXCJwaWxsLWNhbmRpZGF0ZVwiKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBfZ2V0U2xhc2hDb21tYW5kKCkge1xuICAgICAgICBjb25zdCBjb21tYW5kVGV4dCA9IHRoaXMubW9kZWwucGFydHMucmVkdWNlKCh0ZXh0LCBwYXJ0KSA9PiB7XG4gICAgICAgICAgICAvLyB1c2UgbXhpZCB0byB0ZXh0aWZ5IHVzZXIgcGlsbHMgaW4gYSBjb21tYW5kXG4gICAgICAgICAgICBpZiAocGFydC50eXBlID09PSBcInVzZXItcGlsbFwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRleHQgKyBwYXJ0LnJlc291cmNlSWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGV4dCArIHBhcnQudGV4dDtcbiAgICAgICAgfSwgXCJcIik7XG4gICAgICAgIHJldHVybiBbZ2V0Q29tbWFuZCh0aGlzLnByb3BzLnJvb20ucm9vbUlkLCBjb21tYW5kVGV4dCksIGNvbW1hbmRUZXh0XTtcbiAgICB9XG5cbiAgICBhc3luYyBfcnVuU2xhc2hDb21tYW5kKGZuKSB7XG4gICAgICAgIGNvbnN0IGNtZCA9IGZuKCk7XG4gICAgICAgIGxldCBlcnJvciA9IGNtZC5lcnJvcjtcbiAgICAgICAgaWYgKGNtZC5wcm9taXNlKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGNtZC5wcm9taXNlO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgZXJyb3IgPSBlcnI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ29tbWFuZCBmYWlsdXJlOiAlc1wiLCBlcnJvcik7XG4gICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgLy8gYXNzdW1lIHRoZSBlcnJvciBpcyBhIHNlcnZlciBlcnJvciB3aGVuIHRoZSBjb21tYW5kIGlzIGFzeW5jXG4gICAgICAgICAgICBjb25zdCBpc1NlcnZlckVycm9yID0gISFjbWQucHJvbWlzZTtcbiAgICAgICAgICAgIGNvbnN0IHRpdGxlID0gaXNTZXJ2ZXJFcnJvciA/IF90ZChcIlNlcnZlciBlcnJvclwiKSA6IF90ZChcIkNvbW1hbmQgZXJyb3JcIik7XG5cbiAgICAgICAgICAgIGxldCBlcnJUZXh0O1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBlcnJvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBlcnJUZXh0ID0gZXJyb3I7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVycm9yLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICBlcnJUZXh0ID0gZXJyb3IubWVzc2FnZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXJyVGV4dCA9IF90KFwiU2VydmVyIHVuYXZhaWxhYmxlLCBvdmVybG9hZGVkLCBvciBzb21ldGhpbmcgZWxzZSB3ZW50IHdyb25nLlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZyh0aXRsZSwgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KHRpdGxlKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZXJyVGV4dCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJDb21tYW5kIHN1Y2Nlc3MuXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgX3NlbmRNZXNzYWdlKCkge1xuICAgICAgICBpZiAodGhpcy5tb2RlbC5pc0VtcHR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc2hvdWxkU2VuZCA9IHRydWU7XG5cbiAgICAgICAgaWYgKCFjb250YWluc0Vtb3RlKHRoaXMubW9kZWwpICYmIHRoaXMuX2lzU2xhc2hDb21tYW5kKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IFtjbWQsIGNvbW1hbmRUZXh0XSA9IHRoaXMuX2dldFNsYXNoQ29tbWFuZCgpO1xuICAgICAgICAgICAgaWYgKGNtZCkge1xuICAgICAgICAgICAgICAgIHNob3VsZFNlbmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9ydW5TbGFzaENvbW1hbmQoY21kKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gYXNrIHRoZSB1c2VyIGlmIHRoZWlyIHVua25vd24gY29tbWFuZCBzaG91bGQgYmUgc2VudCBhcyBhIG1lc3NhZ2VcbiAgICAgICAgICAgICAgICBjb25zdCBRdWVzdGlvbkRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLlF1ZXN0aW9uRGlhbG9nXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHtmaW5pc2hlZH0gPSBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKFwiVW5rbm93biBjb21tYW5kXCIsIFwiXCIsIFF1ZXN0aW9uRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIlVua25vd24gQ29tbWFuZFwiKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IF90KFwiVW5yZWNvZ25pc2VkIGNvbW1hbmQ6ICUoY29tbWFuZFRleHQpc1wiLCB7Y29tbWFuZFRleHR9KSB9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IF90KFwiWW91IGNhbiB1c2UgPGNvZGU+L2hlbHA8L2NvZGU+IHRvIGxpc3QgYXZhaWxhYmxlIGNvbW1hbmRzLiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiRGlkIHlvdSBtZWFuIHRvIHNlbmQgdGhpcyBhcyBhIG1lc3NhZ2U/XCIsIHt9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IHQgPT4gPGNvZGU+eyB0IH08L2NvZGU+LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoXCJIaW50OiBCZWdpbiB5b3VyIG1lc3NhZ2Ugd2l0aCA8Y29kZT4vLzwvY29kZT4gdG8gc3RhcnQgaXQgd2l0aCBhIHNsYXNoLlwiLCB7fSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiB0ID0+IDxjb2RlPnsgdCB9PC9jb2RlPixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSB9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PixcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uOiBfdCgnU2VuZCBhcyBtZXNzYWdlJyksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgW3NlbmRBbnl3YXldID0gYXdhaXQgZmluaXNoZWQ7XG4gICAgICAgICAgICAgICAgLy8gaWYgIXNlbmRBbnl3YXkgYmFpbCB0byBsZXQgdGhlIHVzZXIgZWRpdCB0aGUgY29tcG9zZXIgYW5kIHRyeSBhZ2FpblxuICAgICAgICAgICAgICAgIGlmICghc2VuZEFueXdheSkgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNob3VsZFNlbmQpIHtcbiAgICAgICAgICAgIGNvbnN0IGlzUmVwbHkgPSAhIVJvb21WaWV3U3RvcmUuZ2V0UXVvdGluZ0V2ZW50KCk7XG4gICAgICAgICAgICBjb25zdCB7cm9vbUlkfSA9IHRoaXMucHJvcHMucm9vbTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBjcmVhdGVNZXNzYWdlQ29udGVudCh0aGlzLm1vZGVsLCB0aGlzLnByb3BzLnBlcm1hbGlua0NyZWF0b3IpO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnNlbmRNZXNzYWdlKHJvb21JZCwgY29udGVudCk7XG4gICAgICAgICAgICBpZiAoaXNSZXBseSkge1xuICAgICAgICAgICAgICAgIC8vIENsZWFyIHJlcGx5X3RvX2V2ZW50IGFzIHdlIHB1dCB0aGUgbWVzc2FnZSBpbnRvIHRoZSBxdWV1ZVxuICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBzZW5kIGZhaWxzLCByZXRyeSB3aWxsIGhhbmRsZSByZXNlbmRpbmcuXG4gICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAncmVwbHlfdG9fZXZlbnQnLFxuICAgICAgICAgICAgICAgICAgICBldmVudDogbnVsbCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2VuZEhpc3RvcnlNYW5hZ2VyLnNhdmUodGhpcy5tb2RlbCk7XG4gICAgICAgIC8vIGNsZWFyIGNvbXBvc2VyXG4gICAgICAgIHRoaXMubW9kZWwucmVzZXQoW10pO1xuICAgICAgICB0aGlzLl9lZGl0b3JSZWYuY2xlYXJVbmRvSGlzdG9yeSgpO1xuICAgICAgICB0aGlzLl9lZGl0b3JSZWYuZm9jdXMoKTtcbiAgICAgICAgdGhpcy5fY2xlYXJTdG9yZWRFZGl0b3JTdGF0ZSgpO1xuICAgIH1cblxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICB0aGlzLl9lZGl0b3JSZWYuZ2V0RWRpdGFibGVSb290Tm9kZSgpLmFkZEV2ZW50TGlzdGVuZXIoXCJwYXN0ZVwiLCB0aGlzLl9vblBhc3RlLCB0cnVlKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgZGlzLnVucmVnaXN0ZXIodGhpcy5kaXNwYXRjaGVyUmVmKTtcbiAgICAgICAgdGhpcy5fZWRpdG9yUmVmLmdldEVkaXRhYmxlUm9vdE5vZGUoKS5yZW1vdmVFdmVudExpc3RlbmVyKFwicGFzdGVcIiwgdGhpcy5fb25QYXN0ZSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIE1vdmUgdGhpcyB0byBjb25zdHJ1Y3RvclxuICAgIFVOU0FGRV9jb21wb25lbnRXaWxsTW91bnQoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY2FtZWxjYXNlXG4gICAgICAgIGNvbnN0IHBhcnRDcmVhdG9yID0gbmV3IENvbW1hbmRQYXJ0Q3JlYXRvcih0aGlzLnByb3BzLnJvb20sIHRoaXMuY29udGV4dCk7XG4gICAgICAgIGNvbnN0IHBhcnRzID0gdGhpcy5fcmVzdG9yZVN0b3JlZEVkaXRvclN0YXRlKHBhcnRDcmVhdG9yKSB8fCBbXTtcbiAgICAgICAgdGhpcy5tb2RlbCA9IG5ldyBFZGl0b3JNb2RlbChwYXJ0cywgcGFydENyZWF0b3IpO1xuICAgICAgICB0aGlzLmRpc3BhdGNoZXJSZWYgPSBkaXMucmVnaXN0ZXIodGhpcy5vbkFjdGlvbik7XG4gICAgICAgIHRoaXMuc2VuZEhpc3RvcnlNYW5hZ2VyID0gbmV3IFNlbmRIaXN0b3J5TWFuYWdlcih0aGlzLnByb3BzLnJvb20ucm9vbUlkLCAnbXhfY2lkZXJfY29tcG9zZXJfaGlzdG9yeV8nKTtcbiAgICB9XG5cbiAgICBnZXQgX2VkaXRvclN0YXRlS2V5KCkge1xuICAgICAgICByZXR1cm4gYGNpZGVyX2VkaXRvcl9zdGF0ZV8ke3RoaXMucHJvcHMucm9vbS5yb29tSWR9YDtcbiAgICB9XG5cbiAgICBfY2xlYXJTdG9yZWRFZGl0b3JTdGF0ZSgpIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0odGhpcy5fZWRpdG9yU3RhdGVLZXkpO1xuICAgIH1cblxuICAgIF9yZXN0b3JlU3RvcmVkRWRpdG9yU3RhdGUocGFydENyZWF0b3IpIHtcbiAgICAgICAgY29uc3QganNvbiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHRoaXMuX2VkaXRvclN0YXRlS2V5KTtcbiAgICAgICAgaWYgKGpzb24pIHtcbiAgICAgICAgICAgIGNvbnN0IHNlcmlhbGl6ZWRQYXJ0cyA9IEpTT04ucGFyc2UoanNvbik7XG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IHNlcmlhbGl6ZWRQYXJ0cy5tYXAocCA9PiBwYXJ0Q3JlYXRvci5kZXNlcmlhbGl6ZVBhcnQocCkpO1xuICAgICAgICAgICAgcmV0dXJuIHBhcnRzO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3NhdmVTdG9yZWRFZGl0b3JTdGF0ZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMubW9kZWwuaXNFbXB0eSkge1xuICAgICAgICAgICAgdGhpcy5fY2xlYXJTdG9yZWRFZGl0b3JTdGF0ZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0odGhpcy5fZWRpdG9yU3RhdGVLZXksIEpTT04uc3RyaW5naWZ5KHRoaXMubW9kZWwuc2VyaWFsaXplUGFydHMoKSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25BY3Rpb24gPSAocGF5bG9hZCkgPT4ge1xuICAgICAgICBzd2l0Y2ggKHBheWxvYWQuYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlICdyZXBseV90b19ldmVudCc6XG4gICAgICAgICAgICBjYXNlICdmb2N1c19jb21wb3Nlcic6XG4gICAgICAgICAgICAgICAgdGhpcy5fZWRpdG9yUmVmICYmIHRoaXMuX2VkaXRvclJlZi5mb2N1cygpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnaW5zZXJ0X21lbnRpb24nOlxuICAgICAgICAgICAgICAgIHRoaXMuX2luc2VydE1lbnRpb24ocGF5bG9hZC51c2VyX2lkKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3F1b3RlJzpcbiAgICAgICAgICAgICAgICB0aGlzLl9pbnNlcnRRdW90ZWRNZXNzYWdlKHBheWxvYWQuZXZlbnQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIF9pbnNlcnRNZW50aW9uKHVzZXJJZCkge1xuICAgICAgICBjb25zdCB7bW9kZWx9ID0gdGhpcztcbiAgICAgICAgY29uc3Qge3BhcnRDcmVhdG9yfSA9IG1vZGVsO1xuICAgICAgICBjb25zdCBtZW1iZXIgPSB0aGlzLnByb3BzLnJvb20uZ2V0TWVtYmVyKHVzZXJJZCk7XG4gICAgICAgIGNvbnN0IGRpc3BsYXlOYW1lID0gbWVtYmVyID9cbiAgICAgICAgICAgIG1lbWJlci5yYXdEaXNwbGF5TmFtZSA6IHVzZXJJZDtcbiAgICAgICAgY29uc3QgY2FyZXQgPSB0aGlzLl9lZGl0b3JSZWYuZ2V0Q2FyZXQoKTtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBtb2RlbC5wb3NpdGlvbkZvck9mZnNldChjYXJldC5vZmZzZXQsIGNhcmV0LmF0Tm9kZUVuZCk7XG4gICAgICAgIC8vIGluZGV4IGlzIC0xIGlmIHRoZXJlIGFyZSBubyBwYXJ0cyBidXQgd2Ugb25seSBjYXJlIGZvciBpZiB0aGlzIHdvdWxkIGJlIHRoZSBwYXJ0IGluIHBvc2l0aW9uIDBcbiAgICAgICAgY29uc3QgaW5zZXJ0SW5kZXggPSBwb3NpdGlvbi5pbmRleCA+IDAgPyBwb3NpdGlvbi5pbmRleCA6IDA7XG4gICAgICAgIGNvbnN0IHBhcnRzID0gcGFydENyZWF0b3IuY3JlYXRlTWVudGlvblBhcnRzKGluc2VydEluZGV4LCBkaXNwbGF5TmFtZSwgdXNlcklkKTtcbiAgICAgICAgbW9kZWwudHJhbnNmb3JtKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFkZGVkTGVuID0gbW9kZWwuaW5zZXJ0KHBhcnRzLCBwb3NpdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gbW9kZWwucG9zaXRpb25Gb3JPZmZzZXQoY2FyZXQub2Zmc2V0ICsgYWRkZWRMZW4sIHRydWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gcmVmb2N1cyBvbiBjb21wb3NlciwgYXMgd2UganVzdCBjbGlja2VkIFwiTWVudGlvblwiXG4gICAgICAgIHRoaXMuX2VkaXRvclJlZiAmJiB0aGlzLl9lZGl0b3JSZWYuZm9jdXMoKTtcbiAgICB9XG5cbiAgICBfaW5zZXJ0UXVvdGVkTWVzc2FnZShldmVudCkge1xuICAgICAgICBjb25zdCB7bW9kZWx9ID0gdGhpcztcbiAgICAgICAgY29uc3Qge3BhcnRDcmVhdG9yfSA9IG1vZGVsO1xuICAgICAgICBjb25zdCBxdW90ZVBhcnRzID0gcGFyc2VFdmVudChldmVudCwgcGFydENyZWF0b3IsIHsgaXNRdW90ZWRNZXNzYWdlOiB0cnVlIH0pO1xuICAgICAgICAvLyBhZGQgdHdvIG5ld2xpbmVzXG4gICAgICAgIHF1b3RlUGFydHMucHVzaChwYXJ0Q3JlYXRvci5uZXdsaW5lKCkpO1xuICAgICAgICBxdW90ZVBhcnRzLnB1c2gocGFydENyZWF0b3IubmV3bGluZSgpKTtcbiAgICAgICAgbW9kZWwudHJhbnNmb3JtKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFkZGVkTGVuID0gbW9kZWwuaW5zZXJ0KHF1b3RlUGFydHMsIG1vZGVsLnBvc2l0aW9uRm9yT2Zmc2V0KDApKTtcbiAgICAgICAgICAgIHJldHVybiBtb2RlbC5wb3NpdGlvbkZvck9mZnNldChhZGRlZExlbiwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyByZWZvY3VzIG9uIGNvbXBvc2VyLCBhcyB3ZSBqdXN0IGNsaWNrZWQgXCJRdW90ZVwiXG4gICAgICAgIHRoaXMuX2VkaXRvclJlZiAmJiB0aGlzLl9lZGl0b3JSZWYuZm9jdXMoKTtcbiAgICB9XG5cbiAgICBfb25QYXN0ZSA9IChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCB7Y2xpcGJvYXJkRGF0YX0gPSBldmVudDtcbiAgICAgICAgaWYgKGNsaXBib2FyZERhdGEuZmlsZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGFjdHVhbGx5IG5vdCBzbyBtdWNoIGZvciAnZmlsZXMnIGFzIHN1Y2ggKGF0IHRpbWUgb2Ygd3JpdGluZ1xuICAgICAgICAgICAgLy8gbmVpdGhlciBjaHJvbWUgbm9yIGZpcmVmb3ggbGV0IHlvdSBwYXN0ZSBhIHBsYWluIGZpbGUgY29waWVkXG4gICAgICAgICAgICAvLyBmcm9tIEZpbmRlcikgYnV0IG1vcmUgaW1hZ2VzIGNvcGllZCBmcm9tIGEgZGlmZmVyZW50IHdlYnNpdGVcbiAgICAgICAgICAgIC8vIC8gd29yZCBwcm9jZXNzb3IgZXRjLlxuICAgICAgICAgICAgQ29udGVudE1lc3NhZ2VzLnNoYXJlZEluc3RhbmNlKCkuc2VuZENvbnRlbnRMaXN0VG9Sb29tKFxuICAgICAgICAgICAgICAgIEFycmF5LmZyb20oY2xpcGJvYXJkRGF0YS5maWxlcyksIHRoaXMucHJvcHMucm9vbS5yb29tSWQsIHRoaXMuY29udGV4dCxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NlbmRNZXNzYWdlQ29tcG9zZXJcIiBvbkNsaWNrPXt0aGlzLmZvY3VzQ29tcG9zZXJ9IG9uS2V5RG93bj17dGhpcy5fb25LZXlEb3dufT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1NlbmRNZXNzYWdlQ29tcG9zZXJfb3ZlcmxheVdyYXBwZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPFJlcGx5UHJldmlldyBwZXJtYWxpbmtDcmVhdG9yPXt0aGlzLnByb3BzLnBlcm1hbGlua0NyZWF0b3J9IC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPEJhc2ljTWVzc2FnZUNvbXBvc2VyXG4gICAgICAgICAgICAgICAgICAgIHJlZj17dGhpcy5fc2V0RWRpdG9yUmVmfVxuICAgICAgICAgICAgICAgICAgICBtb2RlbD17dGhpcy5tb2RlbH1cbiAgICAgICAgICAgICAgICAgICAgcm9vbT17dGhpcy5wcm9wcy5yb29tfVxuICAgICAgICAgICAgICAgICAgICBsYWJlbD17dGhpcy5wcm9wcy5wbGFjZWhvbGRlcn1cbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e3RoaXMucHJvcHMucGxhY2Vob2xkZXJ9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl9zYXZlU3RvcmVkRWRpdG9yU3RhdGV9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==