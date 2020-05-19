"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _highlight = _interopRequireDefault(require("highlight.js"));

var HtmlUtils = _interopRequireWildcard(require("../../../HtmlUtils"));

var _DateUtils = require("../../../DateUtils");

var sdk = _interopRequireWildcard(require("../../../index"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _languageHandler = require("../../../languageHandler");

var ContextMenu = _interopRequireWildcard(require("../../structures/ContextMenu"));

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _ReplyThread = _interopRequireDefault(require("../elements/ReplyThread"));

var _pillify = require("../../../utils/pillify");

var _IntegrationManagers = require("../../../integrations/IntegrationManagers");

var _Permalinks = require("../../../utils/permalinks/Permalinks");

var _strings = require("../../../utils/strings");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var _default = (0, _createReactClass.default)({
  displayName: 'TextualBody',
  propTypes: {
    /* the MatrixEvent to show */
    mxEvent: _propTypes.default.object.isRequired,

    /* a list of words to highlight */
    highlights: _propTypes.default.array,

    /* link URL for the highlights */
    highlightLink: _propTypes.default.string,

    /* should show URL previews for this event */
    showUrlPreview: _propTypes.default.bool,

    /* callback for when our widget has loaded */
    onHeightChanged: _propTypes.default.func,

    /* the shape of the tile, used */
    tileShape: _propTypes.default.string
  },
  getInitialState: function () {
    return {
      // the URLs (if any) to be previewed with a LinkPreviewWidget
      // inside this TextualBody.
      links: [],
      // track whether the preview widget is hidden
      widgetHidden: false
    };
  },
  // TODO: [REACT-WARNING] Replace component with real class, use constructor for refs
  UNSAFE_componentWillMount: function () {
    this._content = (0, _react.createRef)();
  },
  componentDidMount: function () {
    this._unmounted = false;
    this._pills = [];

    if (!this.props.editState) {
      this._applyFormatting();
    }
  },

  _applyFormatting() {
    this.activateSpoilers([this._content.current]); // pillifyLinks BEFORE linkifyElement because plain room/user URLs in the composer
    // are still sent as plaintext URLs. If these are ever pillified in the composer,
    // we should be pillify them here by doing the linkifying BEFORE the pillifying.

    (0, _pillify.pillifyLinks)([this._content.current], this.props.mxEvent, this._pills);
    HtmlUtils.linkifyElement(this._content.current);
    this.calculateUrlPreview();

    if (this.props.mxEvent.getContent().format === "org.matrix.custom.html") {
      const blocks = _reactDom.default.findDOMNode(this).getElementsByTagName("code");

      if (blocks.length > 0) {
        // Do this asynchronously: parsing code takes time and we don't
        // need to block the DOM update on it.
        setTimeout(() => {
          if (this._unmounted) return;

          for (let i = 0; i < blocks.length; i++) {
            if (_SettingsStore.default.getValue("enableSyntaxHighlightLanguageDetection")) {
              _highlight.default.highlightBlock(blocks[i]);
            } else {
              // Only syntax highlight if there's a class starting with language-
              const classes = blocks[i].className.split(/\s+/).filter(function (cl) {
                return cl.startsWith('language-');
              });

              if (classes.length != 0) {
                _highlight.default.highlightBlock(blocks[i]);
              }
            }
          }
        }, 10);
      }

      this._addCodeCopyButton();
    }
  },

  componentDidUpdate: function (prevProps) {
    if (!this.props.editState) {
      const stoppedEditing = prevProps.editState && !this.props.editState;
      const messageWasEdited = prevProps.replacingEventId !== this.props.replacingEventId;

      if (messageWasEdited || stoppedEditing) {
        this._applyFormatting();
      }
    }
  },
  componentWillUnmount: function () {
    this._unmounted = true;
    (0, _pillify.unmountPills)(this._pills);
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    //console.info("shouldComponentUpdate: ShowUrlPreview for %s is %s", this.props.mxEvent.getId(), this.props.showUrlPreview);
    // exploit that events are immutable :)
    return nextProps.mxEvent.getId() !== this.props.mxEvent.getId() || nextProps.highlights !== this.props.highlights || nextProps.replacingEventId !== this.props.replacingEventId || nextProps.highlightLink !== this.props.highlightLink || nextProps.showUrlPreview !== this.props.showUrlPreview || nextProps.editState !== this.props.editState || nextState.links !== this.state.links || nextState.editedMarkerHovered !== this.state.editedMarkerHovered || nextState.widgetHidden !== this.state.widgetHidden;
  },
  calculateUrlPreview: function () {
    //console.info("calculateUrlPreview: ShowUrlPreview for %s is %s", this.props.mxEvent.getId(), this.props.showUrlPreview);
    if (this.props.showUrlPreview) {
      // pass only the first child which is the event tile otherwise this recurses on edited events
      let links = this.findLinks([this._content.current]);

      if (links.length) {
        // de-dup the links (but preserve ordering)
        const seen = new Set();
        links = links.filter(link => {
          if (seen.has(link)) return false;
          seen.add(link);
          return true;
        });
        this.setState({
          links: links
        }); // lazy-load the hidden state of the preview widget from localstorage

        if (global.localStorage) {
          const hidden = global.localStorage.getItem("hide_preview_" + this.props.mxEvent.getId());
          this.setState({
            widgetHidden: hidden
          });
        }
      }
    }
  },
  activateSpoilers: function (nodes) {
    let node = nodes[0];

    while (node) {
      if (node.tagName === "SPAN" && typeof node.getAttribute("data-mx-spoiler") === "string") {
        const spoilerContainer = document.createElement('span');
        const reason = node.getAttribute("data-mx-spoiler");
        const Spoiler = sdk.getComponent('elements.Spoiler');
        node.removeAttribute("data-mx-spoiler"); // we don't want to recurse

        const spoiler = /*#__PURE__*/_react.default.createElement(Spoiler, {
          reason: reason,
          contentHtml: node.outerHTML
        });

        _reactDom.default.render(spoiler, spoilerContainer);

        node.parentNode.replaceChild(spoilerContainer, node);
        node = spoilerContainer;
      }

      if (node.childNodes && node.childNodes.length) {
        this.activateSpoilers(node.childNodes);
      }

      node = node.nextSibling;
    }
  },
  findLinks: function (nodes) {
    let links = [];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      if (node.tagName === "A" && node.getAttribute("href")) {
        if (this.isLinkPreviewable(node)) {
          links.push(node.getAttribute("href"));
        }
      } else if (node.tagName === "PRE" || node.tagName === "CODE" || node.tagName === "BLOCKQUOTE") {
        continue;
      } else if (node.children && node.children.length) {
        links = links.concat(this.findLinks(node.children));
      }
    }

    return links;
  },
  isLinkPreviewable: function (node) {
    // don't try to preview relative links
    if (!node.getAttribute("href").startsWith("http://") && !node.getAttribute("href").startsWith("https://")) {
      return false;
    } // as a random heuristic to avoid highlighting things like "foo.pl"
    // we require the linked text to either include a / (either from http://
    // or from a full foo.bar/baz style schemeless URL) - or be a markdown-style
    // link, in which case we check the target text differs from the link value.
    // TODO: make this configurable?


    if (node.textContent.indexOf("/") > -1) {
      return true;
    } else {
      const url = node.getAttribute("href");
      const host = url.match(/^https?:\/\/(.*?)(\/|$)/)[1]; // never preview permalinks (if anything we should give a smart
      // preview of the room/user they point to: nobody needs to be reminded
      // what the matrix.to site looks like).

      if ((0, _Permalinks.isPermalinkHost)(host)) return false;

      if (node.textContent.toLowerCase().trim().startsWith(host.toLowerCase())) {
        // it's a "foo.pl" style link
        return false;
      } else {
        // it's a [foo bar](http://foo.com) style link
        return true;
      }
    }
  },

  _addCodeCopyButton() {
    // Add 'copy' buttons to pre blocks
    Array.from(_reactDom.default.findDOMNode(this).querySelectorAll('.mx_EventTile_body pre')).forEach(p => {
      const button = document.createElement("span");
      button.className = "mx_EventTile_copyButton";

      button.onclick = async () => {
        const copyCode = button.parentNode.getElementsByTagName("pre")[0];
        const successful = await (0, _strings.copyPlaintext)(copyCode.textContent);
        const buttonRect = button.getBoundingClientRect();
        const GenericTextContextMenu = sdk.getComponent('context_menus.GenericTextContextMenu');
        const {
          close
        } = ContextMenu.createMenu(GenericTextContextMenu, _objectSpread({}, (0, ContextMenu.toRightOf)(buttonRect, 2), {
          message: successful ? (0, _languageHandler._t)('Copied!') : (0, _languageHandler._t)('Failed to copy')
        }));
        button.onmouseleave = close;
      }; // Wrap a div around <pre> so that the copy button can be correctly positioned
      // when the <pre> overflows and is scrolled horizontally.


      const div = document.createElement("div");
      div.className = "mx_EventTile_pre_container"; // Insert containing div in place of <pre> block

      p.parentNode.replaceChild(div, p); // Append <pre> block and copy button to container

      div.appendChild(p);
      div.appendChild(button);
    });
  },

  onCancelClick: function (event) {
    this.setState({
      widgetHidden: true
    }); // FIXME: persist this somewhere smarter than local storage

    if (global.localStorage) {
      global.localStorage.setItem("hide_preview_" + this.props.mxEvent.getId(), "1");
    }

    this.forceUpdate();
  },
  onEmoteSenderClick: function (event) {
    const mxEvent = this.props.mxEvent;

    _dispatcher.default.dispatch({
      action: 'insert_mention',
      user_id: mxEvent.getSender()
    });
  },
  getEventTileOps: function () {
    return {
      isWidgetHidden: () => {
        return this.state.widgetHidden;
      },
      unhideWidget: () => {
        this.setState({
          widgetHidden: false
        });

        if (global.localStorage) {
          global.localStorage.removeItem("hide_preview_" + this.props.mxEvent.getId());
        }
      }
    };
  },
  onStarterLinkClick: function (starterLink, ev) {
    ev.preventDefault(); // We need to add on our scalar token to the starter link, but we may not have one!
    // In addition, we can't fetch one on click and then go to it immediately as that
    // is then treated as a popup!
    // We can get around this by fetching one now and showing a "confirmation dialog" (hurr hurr)
    // which requires the user to click through and THEN we can open the link in a new tab because
    // the window.open command occurs in the same stack frame as the onClick callback.

    const managers = _IntegrationManagers.IntegrationManagers.sharedInstance();

    if (!managers.hasManager()) {
      managers.openNoManagerDialog();
      return;
    } // Go fetch a scalar token


    const integrationManager = managers.getPrimaryManager();
    const scalarClient = integrationManager.getScalarClient();
    scalarClient.connect().then(() => {
      const completeUrl = scalarClient.getStarterLink(starterLink);
      const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");
      const integrationsUrl = integrationManager.uiUrl;

      _Modal.default.createTrackedDialog('Add an integration', '', QuestionDialog, {
        title: (0, _languageHandler._t)("Add an Integration"),
        description: /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("You are about to be taken to a third-party site so you can " + "authenticate your account for use with %(integrationsUrl)s. " + "Do you wish to continue?", {
          integrationsUrl: integrationsUrl
        })),
        button: (0, _languageHandler._t)("Continue"),
        onFinished: function (confirmed) {
          if (!confirmed) {
            return;
          }

          const width = window.screen.width > 1024 ? 1024 : window.screen.width;
          const height = window.screen.height > 800 ? 800 : window.screen.height;
          const left = (window.screen.width - width) / 2;
          const top = (window.screen.height - height) / 2;
          const features = "height=".concat(height, ", width=").concat(width, ", top=").concat(top, ", left=").concat(left, ",");
          const wnd = window.open(completeUrl, '_blank', features);
          wnd.opener = null;
        }
      });
    });
  },
  _onMouseEnterEditedMarker: function () {
    this.setState({
      editedMarkerHovered: true
    });
  },
  _onMouseLeaveEditedMarker: function () {
    this.setState({
      editedMarkerHovered: false
    });
  },
  _openHistoryDialog: async function () {
    const MessageEditHistoryDialog = sdk.getComponent("views.dialogs.MessageEditHistoryDialog");

    _Modal.default.createDialog(MessageEditHistoryDialog, {
      mxEvent: this.props.mxEvent
    });
  },
  _renderEditedMarker: function () {
    let editedTooltip;

    if (this.state.editedMarkerHovered) {
      const Tooltip = sdk.getComponent('elements.Tooltip');
      const date = this.props.mxEvent.replacingEventDate();
      const dateString = date && (0, _DateUtils.formatDate)(date);
      editedTooltip = /*#__PURE__*/_react.default.createElement(Tooltip, {
        tooltipClassName: "mx_Tooltip_timeline",
        label: (0, _languageHandler._t)("Edited at %(date)s. Click to view edits.", {
          date: dateString
        })
      });
    }

    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    return /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      key: "editedMarker",
      className: "mx_EventTile_edited",
      onClick: this._openHistoryDialog,
      onMouseEnter: this._onMouseEnterEditedMarker,
      onMouseLeave: this._onMouseLeaveEditedMarker
    }, editedTooltip, /*#__PURE__*/_react.default.createElement("span", null, "(".concat((0, _languageHandler._t)("edited"), ")")));
  },
  render: function () {
    if (this.props.editState) {
      const EditMessageComposer = sdk.getComponent('rooms.EditMessageComposer');
      return /*#__PURE__*/_react.default.createElement(EditMessageComposer, {
        editState: this.props.editState,
        className: "mx_EventTile_content"
      });
    }

    const mxEvent = this.props.mxEvent;
    const content = mxEvent.getContent();

    const stripReply = _ReplyThread.default.getParentEventId(mxEvent);

    let body = HtmlUtils.bodyToHtml(content, this.props.highlights, {
      disableBigEmoji: content.msgtype === "m.emote" || !_SettingsStore.default.getValue('TextualBody.enableBigEmoji'),
      // Part of Replies fallback support
      stripReplyFallback: stripReply,
      ref: this._content
    });

    if (this.props.replacingEventId) {
      body = [body, this._renderEditedMarker()];
    }

    if (this.props.highlightLink) {
      body = /*#__PURE__*/_react.default.createElement("a", {
        href: this.props.highlightLink
      }, body);
    } else if (content.data && typeof content.data["org.matrix.neb.starter_link"] === "string") {
      body = /*#__PURE__*/_react.default.createElement("a", {
        href: "#",
        onClick: this.onStarterLinkClick.bind(this, content.data["org.matrix.neb.starter_link"])
      }, body);
    }

    let widgets;

    if (this.state.links.length && !this.state.widgetHidden && this.props.showUrlPreview) {
      const LinkPreviewWidget = sdk.getComponent('rooms.LinkPreviewWidget');
      widgets = this.state.links.map(link => {
        return /*#__PURE__*/_react.default.createElement(LinkPreviewWidget, {
          key: link,
          link: link,
          mxEvent: this.props.mxEvent,
          onCancelClick: this.onCancelClick,
          onHeightChanged: this.props.onHeightChanged
        });
      });
    }

    switch (content.msgtype) {
      case "m.emote":
        return /*#__PURE__*/_react.default.createElement("span", {
          className: "mx_MEmoteBody mx_EventTile_content"
        }, "*\xA0", /*#__PURE__*/_react.default.createElement("span", {
          className: "mx_MEmoteBody_sender",
          onClick: this.onEmoteSenderClick
        }, mxEvent.sender ? mxEvent.sender.name : mxEvent.getSender()), "\xA0", body, widgets);

      case "m.notice":
        return /*#__PURE__*/_react.default.createElement("span", {
          className: "mx_MNoticeBody mx_EventTile_content"
        }, body, widgets);

      default:
        // including "m.text"
        return /*#__PURE__*/_react.default.createElement("span", {
          className: "mx_MTextBody mx_EventTile_content"
        }, body, widgets);
    }
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL21lc3NhZ2VzL1RleHR1YWxCb2R5LmpzIl0sIm5hbWVzIjpbImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwibXhFdmVudCIsIlByb3BUeXBlcyIsIm9iamVjdCIsImlzUmVxdWlyZWQiLCJoaWdobGlnaHRzIiwiYXJyYXkiLCJoaWdobGlnaHRMaW5rIiwic3RyaW5nIiwic2hvd1VybFByZXZpZXciLCJib29sIiwib25IZWlnaHRDaGFuZ2VkIiwiZnVuYyIsInRpbGVTaGFwZSIsImdldEluaXRpYWxTdGF0ZSIsImxpbmtzIiwid2lkZ2V0SGlkZGVuIiwiVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudCIsIl9jb250ZW50IiwiY29tcG9uZW50RGlkTW91bnQiLCJfdW5tb3VudGVkIiwiX3BpbGxzIiwicHJvcHMiLCJlZGl0U3RhdGUiLCJfYXBwbHlGb3JtYXR0aW5nIiwiYWN0aXZhdGVTcG9pbGVycyIsImN1cnJlbnQiLCJIdG1sVXRpbHMiLCJsaW5raWZ5RWxlbWVudCIsImNhbGN1bGF0ZVVybFByZXZpZXciLCJnZXRDb250ZW50IiwiZm9ybWF0IiwiYmxvY2tzIiwiUmVhY3RET00iLCJmaW5kRE9NTm9kZSIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwibGVuZ3RoIiwic2V0VGltZW91dCIsImkiLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJoaWdobGlnaHQiLCJoaWdobGlnaHRCbG9jayIsImNsYXNzZXMiLCJjbGFzc05hbWUiLCJzcGxpdCIsImZpbHRlciIsImNsIiwic3RhcnRzV2l0aCIsIl9hZGRDb2RlQ29weUJ1dHRvbiIsImNvbXBvbmVudERpZFVwZGF0ZSIsInByZXZQcm9wcyIsInN0b3BwZWRFZGl0aW5nIiwibWVzc2FnZVdhc0VkaXRlZCIsInJlcGxhY2luZ0V2ZW50SWQiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInNob3VsZENvbXBvbmVudFVwZGF0ZSIsIm5leHRQcm9wcyIsIm5leHRTdGF0ZSIsImdldElkIiwic3RhdGUiLCJlZGl0ZWRNYXJrZXJIb3ZlcmVkIiwiZmluZExpbmtzIiwic2VlbiIsIlNldCIsImxpbmsiLCJoYXMiLCJhZGQiLCJzZXRTdGF0ZSIsImdsb2JhbCIsImxvY2FsU3RvcmFnZSIsImhpZGRlbiIsImdldEl0ZW0iLCJub2RlcyIsIm5vZGUiLCJ0YWdOYW1lIiwiZ2V0QXR0cmlidXRlIiwic3BvaWxlckNvbnRhaW5lciIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsInJlYXNvbiIsIlNwb2lsZXIiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJyZW1vdmVBdHRyaWJ1dGUiLCJzcG9pbGVyIiwib3V0ZXJIVE1MIiwicmVuZGVyIiwicGFyZW50Tm9kZSIsInJlcGxhY2VDaGlsZCIsImNoaWxkTm9kZXMiLCJuZXh0U2libGluZyIsImlzTGlua1ByZXZpZXdhYmxlIiwicHVzaCIsImNoaWxkcmVuIiwiY29uY2F0IiwidGV4dENvbnRlbnQiLCJpbmRleE9mIiwidXJsIiwiaG9zdCIsIm1hdGNoIiwidG9Mb3dlckNhc2UiLCJ0cmltIiwiQXJyYXkiLCJmcm9tIiwicXVlcnlTZWxlY3RvckFsbCIsImZvckVhY2giLCJwIiwiYnV0dG9uIiwib25jbGljayIsImNvcHlDb2RlIiwic3VjY2Vzc2Z1bCIsImJ1dHRvblJlY3QiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJHZW5lcmljVGV4dENvbnRleHRNZW51IiwiY2xvc2UiLCJDb250ZXh0TWVudSIsImNyZWF0ZU1lbnUiLCJtZXNzYWdlIiwib25tb3VzZWxlYXZlIiwiZGl2IiwiYXBwZW5kQ2hpbGQiLCJvbkNhbmNlbENsaWNrIiwiZXZlbnQiLCJzZXRJdGVtIiwiZm9yY2VVcGRhdGUiLCJvbkVtb3RlU2VuZGVyQ2xpY2siLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsInVzZXJfaWQiLCJnZXRTZW5kZXIiLCJnZXRFdmVudFRpbGVPcHMiLCJpc1dpZGdldEhpZGRlbiIsInVuaGlkZVdpZGdldCIsInJlbW92ZUl0ZW0iLCJvblN0YXJ0ZXJMaW5rQ2xpY2siLCJzdGFydGVyTGluayIsImV2IiwicHJldmVudERlZmF1bHQiLCJtYW5hZ2VycyIsIkludGVncmF0aW9uTWFuYWdlcnMiLCJzaGFyZWRJbnN0YW5jZSIsImhhc01hbmFnZXIiLCJvcGVuTm9NYW5hZ2VyRGlhbG9nIiwiaW50ZWdyYXRpb25NYW5hZ2VyIiwiZ2V0UHJpbWFyeU1hbmFnZXIiLCJzY2FsYXJDbGllbnQiLCJnZXRTY2FsYXJDbGllbnQiLCJjb25uZWN0IiwidGhlbiIsImNvbXBsZXRlVXJsIiwiZ2V0U3RhcnRlckxpbmsiLCJRdWVzdGlvbkRpYWxvZyIsImludGVncmF0aW9uc1VybCIsInVpVXJsIiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsIm9uRmluaXNoZWQiLCJjb25maXJtZWQiLCJ3aWR0aCIsIndpbmRvdyIsInNjcmVlbiIsImhlaWdodCIsImxlZnQiLCJ0b3AiLCJmZWF0dXJlcyIsInduZCIsIm9wZW4iLCJvcGVuZXIiLCJfb25Nb3VzZUVudGVyRWRpdGVkTWFya2VyIiwiX29uTW91c2VMZWF2ZUVkaXRlZE1hcmtlciIsIl9vcGVuSGlzdG9yeURpYWxvZyIsIk1lc3NhZ2VFZGl0SGlzdG9yeURpYWxvZyIsImNyZWF0ZURpYWxvZyIsIl9yZW5kZXJFZGl0ZWRNYXJrZXIiLCJlZGl0ZWRUb29sdGlwIiwiVG9vbHRpcCIsImRhdGUiLCJyZXBsYWNpbmdFdmVudERhdGUiLCJkYXRlU3RyaW5nIiwiQWNjZXNzaWJsZUJ1dHRvbiIsIkVkaXRNZXNzYWdlQ29tcG9zZXIiLCJjb250ZW50Iiwic3RyaXBSZXBseSIsIlJlcGx5VGhyZWFkIiwiZ2V0UGFyZW50RXZlbnRJZCIsImJvZHkiLCJib2R5VG9IdG1sIiwiZGlzYWJsZUJpZ0Vtb2ppIiwibXNndHlwZSIsInN0cmlwUmVwbHlGYWxsYmFjayIsInJlZiIsImRhdGEiLCJiaW5kIiwid2lkZ2V0cyIsIkxpbmtQcmV2aWV3V2lkZ2V0IiwibWFwIiwic2Vu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LENBRkosVUFTTTBELElBVE4sRUFVTVEsT0FWTixDQURKOztBQWNKLFdBQUssVUFBTDtBQUNJLDRCQUNJO0FBQU0sVUFBQSxTQUFTLEVBQUM7QUFBaEIsV0FDTVIsSUFETixFQUVNUSxPQUZOLENBREo7O0FBTUo7QUFBUztBQUNMLDRCQUNJO0FBQU0sVUFBQSxTQUFTLEVBQUM7QUFBaEIsV0FDTVIsSUFETixFQUVNUSxPQUZOLENBREo7QUF4QlI7QUErQkg7QUF2YjJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE3IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCwge2NyZWF0ZVJlZn0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IFJlYWN0RE9NIGZyb20gJ3JlYWN0LWRvbSc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCBoaWdobGlnaHQgZnJvbSAnaGlnaGxpZ2h0LmpzJztcbmltcG9ydCAqIGFzIEh0bWxVdGlscyBmcm9tICcuLi8uLi8uLi9IdG1sVXRpbHMnO1xuaW1wb3J0IHtmb3JtYXREYXRlfSBmcm9tICcuLi8uLi8uLi9EYXRlVXRpbHMnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCBNb2RhbCBmcm9tICcuLi8uLi8uLi9Nb2RhbCc7XG5pbXBvcnQgZGlzIGZyb20gJy4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgKiBhcyBDb250ZXh0TWVudSBmcm9tICcuLi8uLi9zdHJ1Y3R1cmVzL0NvbnRleHRNZW51JztcbmltcG9ydCBTZXR0aW5nc1N0b3JlIGZyb20gXCIuLi8uLi8uLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlXCI7XG5pbXBvcnQgUmVwbHlUaHJlYWQgZnJvbSBcIi4uL2VsZW1lbnRzL1JlcGx5VGhyZWFkXCI7XG5pbXBvcnQge3BpbGxpZnlMaW5rcywgdW5tb3VudFBpbGxzfSBmcm9tICcuLi8uLi8uLi91dGlscy9waWxsaWZ5JztcbmltcG9ydCB7SW50ZWdyYXRpb25NYW5hZ2Vyc30gZnJvbSBcIi4uLy4uLy4uL2ludGVncmF0aW9ucy9JbnRlZ3JhdGlvbk1hbmFnZXJzXCI7XG5pbXBvcnQge2lzUGVybWFsaW5rSG9zdH0gZnJvbSBcIi4uLy4uLy4uL3V0aWxzL3Blcm1hbGlua3MvUGVybWFsaW5rc1wiO1xuaW1wb3J0IHt0b1JpZ2h0T2Z9IGZyb20gXCIuLi8uLi9zdHJ1Y3R1cmVzL0NvbnRleHRNZW51XCI7XG5pbXBvcnQge2NvcHlQbGFpbnRleHR9IGZyb20gXCIuLi8uLi8uLi91dGlscy9zdHJpbmdzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnVGV4dHVhbEJvZHknLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIC8qIHRoZSBNYXRyaXhFdmVudCB0byBzaG93ICovXG4gICAgICAgIG14RXZlbnQ6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcblxuICAgICAgICAvKiBhIGxpc3Qgb2Ygd29yZHMgdG8gaGlnaGxpZ2h0ICovXG4gICAgICAgIGhpZ2hsaWdodHM6IFByb3BUeXBlcy5hcnJheSxcblxuICAgICAgICAvKiBsaW5rIFVSTCBmb3IgdGhlIGhpZ2hsaWdodHMgKi9cbiAgICAgICAgaGlnaGxpZ2h0TGluazogUHJvcFR5cGVzLnN0cmluZyxcblxuICAgICAgICAvKiBzaG91bGQgc2hvdyBVUkwgcHJldmlld3MgZm9yIHRoaXMgZXZlbnQgKi9cbiAgICAgICAgc2hvd1VybFByZXZpZXc6IFByb3BUeXBlcy5ib29sLFxuXG4gICAgICAgIC8qIGNhbGxiYWNrIGZvciB3aGVuIG91ciB3aWRnZXQgaGFzIGxvYWRlZCAqL1xuICAgICAgICBvbkhlaWdodENoYW5nZWQ6IFByb3BUeXBlcy5mdW5jLFxuXG4gICAgICAgIC8qIHRoZSBzaGFwZSBvZiB0aGUgdGlsZSwgdXNlZCAqL1xuICAgICAgICB0aWxlU2hhcGU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyB0aGUgVVJMcyAoaWYgYW55KSB0byBiZSBwcmV2aWV3ZWQgd2l0aCBhIExpbmtQcmV2aWV3V2lkZ2V0XG4gICAgICAgICAgICAvLyBpbnNpZGUgdGhpcyBUZXh0dWFsQm9keS5cbiAgICAgICAgICAgIGxpbmtzOiBbXSxcblxuICAgICAgICAgICAgLy8gdHJhY2sgd2hldGhlciB0aGUgcHJldmlldyB3aWRnZXQgaXMgaGlkZGVuXG4gICAgICAgICAgICB3aWRnZXRIaWRkZW46IGZhbHNlLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvLyBUT0RPOiBbUkVBQ1QtV0FSTklOR10gUmVwbGFjZSBjb21wb25lbnQgd2l0aCByZWFsIGNsYXNzLCB1c2UgY29uc3RydWN0b3IgZm9yIHJlZnNcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fY29udGVudCA9IGNyZWF0ZVJlZigpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3VubW91bnRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9waWxscyA9IFtdO1xuICAgICAgICBpZiAoIXRoaXMucHJvcHMuZWRpdFN0YXRlKSB7XG4gICAgICAgICAgICB0aGlzLl9hcHBseUZvcm1hdHRpbmcoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfYXBwbHlGb3JtYXR0aW5nKCkge1xuICAgICAgICB0aGlzLmFjdGl2YXRlU3BvaWxlcnMoW3RoaXMuX2NvbnRlbnQuY3VycmVudF0pO1xuXG4gICAgICAgIC8vIHBpbGxpZnlMaW5rcyBCRUZPUkUgbGlua2lmeUVsZW1lbnQgYmVjYXVzZSBwbGFpbiByb29tL3VzZXIgVVJMcyBpbiB0aGUgY29tcG9zZXJcbiAgICAgICAgLy8gYXJlIHN0aWxsIHNlbnQgYXMgcGxhaW50ZXh0IFVSTHMuIElmIHRoZXNlIGFyZSBldmVyIHBpbGxpZmllZCBpbiB0aGUgY29tcG9zZXIsXG4gICAgICAgIC8vIHdlIHNob3VsZCBiZSBwaWxsaWZ5IHRoZW0gaGVyZSBieSBkb2luZyB0aGUgbGlua2lmeWluZyBCRUZPUkUgdGhlIHBpbGxpZnlpbmcuXG4gICAgICAgIHBpbGxpZnlMaW5rcyhbdGhpcy5fY29udGVudC5jdXJyZW50XSwgdGhpcy5wcm9wcy5teEV2ZW50LCB0aGlzLl9waWxscyk7XG4gICAgICAgIEh0bWxVdGlscy5saW5raWZ5RWxlbWVudCh0aGlzLl9jb250ZW50LmN1cnJlbnQpO1xuICAgICAgICB0aGlzLmNhbGN1bGF0ZVVybFByZXZpZXcoKTtcblxuICAgICAgICBpZiAodGhpcy5wcm9wcy5teEV2ZW50LmdldENvbnRlbnQoKS5mb3JtYXQgPT09IFwib3JnLm1hdHJpeC5jdXN0b20uaHRtbFwiKSB7XG4gICAgICAgICAgICBjb25zdCBibG9ja3MgPSBSZWFjdERPTS5maW5kRE9NTm9kZSh0aGlzKS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNvZGVcIik7XG4gICAgICAgICAgICBpZiAoYmxvY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAvLyBEbyB0aGlzIGFzeW5jaHJvbm91c2x5OiBwYXJzaW5nIGNvZGUgdGFrZXMgdGltZSBhbmQgd2UgZG9uJ3RcbiAgICAgICAgICAgICAgICAvLyBuZWVkIHRvIGJsb2NrIHRoZSBET00gdXBkYXRlIG9uIGl0LlxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fdW5tb3VudGVkKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImVuYWJsZVN5bnRheEhpZ2hsaWdodExhbmd1YWdlRGV0ZWN0aW9uXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGxpZ2h0LmhpZ2hsaWdodEJsb2NrKGJsb2Nrc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgc3ludGF4IGhpZ2hsaWdodCBpZiB0aGVyZSdzIGEgY2xhc3Mgc3RhcnRpbmcgd2l0aCBsYW5ndWFnZS1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjbGFzc2VzID0gYmxvY2tzW2ldLmNsYXNzTmFtZS5zcGxpdCgvXFxzKy8pLmZpbHRlcihmdW5jdGlvbihjbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2wuc3RhcnRzV2l0aCgnbGFuZ3VhZ2UtJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xhc3Nlcy5sZW5ndGggIT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHQuaGlnaGxpZ2h0QmxvY2soYmxvY2tzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCAxMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9hZGRDb2RlQ29weUJ1dHRvbigpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24ocHJldlByb3BzKSB7XG4gICAgICAgIGlmICghdGhpcy5wcm9wcy5lZGl0U3RhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0b3BwZWRFZGl0aW5nID0gcHJldlByb3BzLmVkaXRTdGF0ZSAmJiAhdGhpcy5wcm9wcy5lZGl0U3RhdGU7XG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlV2FzRWRpdGVkID0gcHJldlByb3BzLnJlcGxhY2luZ0V2ZW50SWQgIT09IHRoaXMucHJvcHMucmVwbGFjaW5nRXZlbnRJZDtcbiAgICAgICAgICAgIGlmIChtZXNzYWdlV2FzRWRpdGVkIHx8IHN0b3BwZWRFZGl0aW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYXBwbHlGb3JtYXR0aW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl91bm1vdW50ZWQgPSB0cnVlO1xuICAgICAgICB1bm1vdW50UGlsbHModGhpcy5fcGlsbHMpO1xuICAgIH0sXG5cbiAgICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG4gICAgICAgIC8vY29uc29sZS5pbmZvKFwic2hvdWxkQ29tcG9uZW50VXBkYXRlOiBTaG93VXJsUHJldmlldyBmb3IgJXMgaXMgJXNcIiwgdGhpcy5wcm9wcy5teEV2ZW50LmdldElkKCksIHRoaXMucHJvcHMuc2hvd1VybFByZXZpZXcpO1xuXG4gICAgICAgIC8vIGV4cGxvaXQgdGhhdCBldmVudHMgYXJlIGltbXV0YWJsZSA6KVxuICAgICAgICByZXR1cm4gKG5leHRQcm9wcy5teEV2ZW50LmdldElkKCkgIT09IHRoaXMucHJvcHMubXhFdmVudC5nZXRJZCgpIHx8XG4gICAgICAgICAgICAgICAgbmV4dFByb3BzLmhpZ2hsaWdodHMgIT09IHRoaXMucHJvcHMuaGlnaGxpZ2h0cyB8fFxuICAgICAgICAgICAgICAgIG5leHRQcm9wcy5yZXBsYWNpbmdFdmVudElkICE9PSB0aGlzLnByb3BzLnJlcGxhY2luZ0V2ZW50SWQgfHxcbiAgICAgICAgICAgICAgICBuZXh0UHJvcHMuaGlnaGxpZ2h0TGluayAhPT0gdGhpcy5wcm9wcy5oaWdobGlnaHRMaW5rIHx8XG4gICAgICAgICAgICAgICAgbmV4dFByb3BzLnNob3dVcmxQcmV2aWV3ICE9PSB0aGlzLnByb3BzLnNob3dVcmxQcmV2aWV3IHx8XG4gICAgICAgICAgICAgICAgbmV4dFByb3BzLmVkaXRTdGF0ZSAhPT0gdGhpcy5wcm9wcy5lZGl0U3RhdGUgfHxcbiAgICAgICAgICAgICAgICBuZXh0U3RhdGUubGlua3MgIT09IHRoaXMuc3RhdGUubGlua3MgfHxcbiAgICAgICAgICAgICAgICBuZXh0U3RhdGUuZWRpdGVkTWFya2VySG92ZXJlZCAhPT0gdGhpcy5zdGF0ZS5lZGl0ZWRNYXJrZXJIb3ZlcmVkIHx8XG4gICAgICAgICAgICAgICAgbmV4dFN0YXRlLndpZGdldEhpZGRlbiAhPT0gdGhpcy5zdGF0ZS53aWRnZXRIaWRkZW4pO1xuICAgIH0sXG5cbiAgICBjYWxjdWxhdGVVcmxQcmV2aWV3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy9jb25zb2xlLmluZm8oXCJjYWxjdWxhdGVVcmxQcmV2aWV3OiBTaG93VXJsUHJldmlldyBmb3IgJXMgaXMgJXNcIiwgdGhpcy5wcm9wcy5teEV2ZW50LmdldElkKCksIHRoaXMucHJvcHMuc2hvd1VybFByZXZpZXcpO1xuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLnNob3dVcmxQcmV2aWV3KSB7XG4gICAgICAgICAgICAvLyBwYXNzIG9ubHkgdGhlIGZpcnN0IGNoaWxkIHdoaWNoIGlzIHRoZSBldmVudCB0aWxlIG90aGVyd2lzZSB0aGlzIHJlY3Vyc2VzIG9uIGVkaXRlZCBldmVudHNcbiAgICAgICAgICAgIGxldCBsaW5rcyA9IHRoaXMuZmluZExpbmtzKFt0aGlzLl9jb250ZW50LmN1cnJlbnRdKTtcbiAgICAgICAgICAgIGlmIChsaW5rcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAvLyBkZS1kdXAgdGhlIGxpbmtzIChidXQgcHJlc2VydmUgb3JkZXJpbmcpXG4gICAgICAgICAgICAgICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgICAgICBsaW5rcyA9IGxpbmtzLmZpbHRlcigobGluaykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2Vlbi5oYXMobGluaykpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2Vlbi5hZGQobGluayk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGxpbmtzOiBsaW5rcyB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGxhenktbG9hZCB0aGUgaGlkZGVuIHN0YXRlIG9mIHRoZSBwcmV2aWV3IHdpZGdldCBmcm9tIGxvY2Fsc3RvcmFnZVxuICAgICAgICAgICAgICAgIGlmIChnbG9iYWwubG9jYWxTdG9yYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhpZGRlbiA9IGdsb2JhbC5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImhpZGVfcHJldmlld19cIiArIHRoaXMucHJvcHMubXhFdmVudC5nZXRJZCgpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IHdpZGdldEhpZGRlbjogaGlkZGVuIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhY3RpdmF0ZVNwb2lsZXJzOiBmdW5jdGlvbihub2Rlcykge1xuICAgICAgICBsZXQgbm9kZSA9IG5vZGVzWzBdO1xuICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgaWYgKG5vZGUudGFnTmFtZSA9PT0gXCJTUEFOXCIgJiYgdHlwZW9mIG5vZGUuZ2V0QXR0cmlidXRlKFwiZGF0YS1teC1zcG9pbGVyXCIpID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3BvaWxlckNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHJlYXNvbiA9IG5vZGUuZ2V0QXR0cmlidXRlKFwiZGF0YS1teC1zcG9pbGVyXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IFNwb2lsZXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5TcG9pbGVyJyk7XG4gICAgICAgICAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLW14LXNwb2lsZXJcIik7IC8vIHdlIGRvbid0IHdhbnQgdG8gcmVjdXJzZVxuICAgICAgICAgICAgICAgIGNvbnN0IHNwb2lsZXIgPSA8U3BvaWxlclxuICAgICAgICAgICAgICAgICAgICByZWFzb249e3JlYXNvbn1cbiAgICAgICAgICAgICAgICAgICAgY29udGVudEh0bWw9e25vZGUub3V0ZXJIVE1MfVxuICAgICAgICAgICAgICAgIC8+O1xuXG4gICAgICAgICAgICAgICAgUmVhY3RET00ucmVuZGVyKHNwb2lsZXIsIHNwb2lsZXJDb250YWluZXIpO1xuICAgICAgICAgICAgICAgIG5vZGUucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoc3BvaWxlckNvbnRhaW5lciwgbm9kZSk7XG5cbiAgICAgICAgICAgICAgICBub2RlID0gc3BvaWxlckNvbnRhaW5lcjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGROb2RlcyAmJiBub2RlLmNoaWxkTm9kZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hY3RpdmF0ZVNwb2lsZXJzKG5vZGUuY2hpbGROb2Rlcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5vZGUgPSBub2RlLm5leHRTaWJsaW5nO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGZpbmRMaW5rczogZnVuY3Rpb24obm9kZXMpIHtcbiAgICAgICAgbGV0IGxpbmtzID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKG5vZGUudGFnTmFtZSA9PT0gXCJBXCIgJiYgbm9kZS5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNMaW5rUHJldmlld2FibGUobm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGlua3MucHVzaChub2RlLmdldEF0dHJpYnV0ZShcImhyZWZcIikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAobm9kZS50YWdOYW1lID09PSBcIlBSRVwiIHx8IG5vZGUudGFnTmFtZSA9PT0gXCJDT0RFXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgbm9kZS50YWdOYW1lID09PSBcIkJMT0NLUVVPVEVcIikge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChub2RlLmNoaWxkcmVuICYmIG5vZGUuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgbGlua3MgPSBsaW5rcy5jb25jYXQodGhpcy5maW5kTGlua3Mobm9kZS5jaGlsZHJlbikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsaW5rcztcbiAgICB9LFxuXG4gICAgaXNMaW5rUHJldmlld2FibGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgLy8gZG9uJ3QgdHJ5IHRvIHByZXZpZXcgcmVsYXRpdmUgbGlua3NcbiAgICAgICAgaWYgKCFub2RlLmdldEF0dHJpYnV0ZShcImhyZWZcIikuc3RhcnRzV2l0aChcImh0dHA6Ly9cIikgJiZcbiAgICAgICAgICAgICFub2RlLmdldEF0dHJpYnV0ZShcImhyZWZcIikuc3RhcnRzV2l0aChcImh0dHBzOi8vXCIpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhcyBhIHJhbmRvbSBoZXVyaXN0aWMgdG8gYXZvaWQgaGlnaGxpZ2h0aW5nIHRoaW5ncyBsaWtlIFwiZm9vLnBsXCJcbiAgICAgICAgLy8gd2UgcmVxdWlyZSB0aGUgbGlua2VkIHRleHQgdG8gZWl0aGVyIGluY2x1ZGUgYSAvIChlaXRoZXIgZnJvbSBodHRwOi8vXG4gICAgICAgIC8vIG9yIGZyb20gYSBmdWxsIGZvby5iYXIvYmF6IHN0eWxlIHNjaGVtZWxlc3MgVVJMKSAtIG9yIGJlIGEgbWFya2Rvd24tc3R5bGVcbiAgICAgICAgLy8gbGluaywgaW4gd2hpY2ggY2FzZSB3ZSBjaGVjayB0aGUgdGFyZ2V0IHRleHQgZGlmZmVycyBmcm9tIHRoZSBsaW5rIHZhbHVlLlxuICAgICAgICAvLyBUT0RPOiBtYWtlIHRoaXMgY29uZmlndXJhYmxlP1xuICAgICAgICBpZiAobm9kZS50ZXh0Q29udGVudC5pbmRleE9mKFwiL1wiKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IG5vZGUuZ2V0QXR0cmlidXRlKFwiaHJlZlwiKTtcbiAgICAgICAgICAgIGNvbnN0IGhvc3QgPSB1cmwubWF0Y2goL15odHRwcz86XFwvXFwvKC4qPykoXFwvfCQpLylbMV07XG5cbiAgICAgICAgICAgIC8vIG5ldmVyIHByZXZpZXcgcGVybWFsaW5rcyAoaWYgYW55dGhpbmcgd2Ugc2hvdWxkIGdpdmUgYSBzbWFydFxuICAgICAgICAgICAgLy8gcHJldmlldyBvZiB0aGUgcm9vbS91c2VyIHRoZXkgcG9pbnQgdG86IG5vYm9keSBuZWVkcyB0byBiZSByZW1pbmRlZFxuICAgICAgICAgICAgLy8gd2hhdCB0aGUgbWF0cml4LnRvIHNpdGUgbG9va3MgbGlrZSkuXG4gICAgICAgICAgICBpZiAoaXNQZXJtYWxpbmtIb3N0KGhvc3QpKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmIChub2RlLnRleHRDb250ZW50LnRvTG93ZXJDYXNlKCkudHJpbSgpLnN0YXJ0c1dpdGgoaG9zdC50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgICAgICAgICAgIC8vIGl0J3MgYSBcImZvby5wbFwiIHN0eWxlIGxpbmtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGl0J3MgYSBbZm9vIGJhcl0oaHR0cDovL2Zvby5jb20pIHN0eWxlIGxpbmtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfYWRkQ29kZUNvcHlCdXR0b24oKSB7XG4gICAgICAgIC8vIEFkZCAnY29weScgYnV0dG9ucyB0byBwcmUgYmxvY2tzXG4gICAgICAgIEFycmF5LmZyb20oUmVhY3RET00uZmluZERPTU5vZGUodGhpcykucXVlcnlTZWxlY3RvckFsbCgnLm14X0V2ZW50VGlsZV9ib2R5IHByZScpKS5mb3JFYWNoKChwKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgICAgIGJ1dHRvbi5jbGFzc05hbWUgPSBcIm14X0V2ZW50VGlsZV9jb3B5QnV0dG9uXCI7XG4gICAgICAgICAgICBidXR0b24ub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb3B5Q29kZSA9IGJ1dHRvbi5wYXJlbnROb2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicHJlXCIpWzBdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3NmdWwgPSBhd2FpdCBjb3B5UGxhaW50ZXh0KGNvcHlDb2RlLnRleHRDb250ZW50KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGJ1dHRvblJlY3QgPSBidXR0b24uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgR2VuZXJpY1RleHRDb250ZXh0TWVudSA9IHNkay5nZXRDb21wb25lbnQoJ2NvbnRleHRfbWVudXMuR2VuZXJpY1RleHRDb250ZXh0TWVudScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHtjbG9zZX0gPSBDb250ZXh0TWVudS5jcmVhdGVNZW51KEdlbmVyaWNUZXh0Q29udGV4dE1lbnUsIHtcbiAgICAgICAgICAgICAgICAgICAgLi4udG9SaWdodE9mKGJ1dHRvblJlY3QsIDIpLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBzdWNjZXNzZnVsID8gX3QoJ0NvcGllZCEnKSA6IF90KCdGYWlsZWQgdG8gY29weScpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJ1dHRvbi5vbm1vdXNlbGVhdmUgPSBjbG9zZTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIFdyYXAgYSBkaXYgYXJvdW5kIDxwcmU+IHNvIHRoYXQgdGhlIGNvcHkgYnV0dG9uIGNhbiBiZSBjb3JyZWN0bHkgcG9zaXRpb25lZFxuICAgICAgICAgICAgLy8gd2hlbiB0aGUgPHByZT4gb3ZlcmZsb3dzIGFuZCBpcyBzY3JvbGxlZCBob3Jpem9udGFsbHkuXG4gICAgICAgICAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgZGl2LmNsYXNzTmFtZSA9IFwibXhfRXZlbnRUaWxlX3ByZV9jb250YWluZXJcIjtcblxuICAgICAgICAgICAgLy8gSW5zZXJ0IGNvbnRhaW5pbmcgZGl2IGluIHBsYWNlIG9mIDxwcmU+IGJsb2NrXG4gICAgICAgICAgICBwLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGRpdiwgcCk7XG5cbiAgICAgICAgICAgIC8vIEFwcGVuZCA8cHJlPiBibG9jayBhbmQgY29weSBidXR0b24gdG8gY29udGFpbmVyXG4gICAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQocCk7XG4gICAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQoYnV0dG9uKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uQ2FuY2VsQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyB3aWRnZXRIaWRkZW46IHRydWUgfSk7XG4gICAgICAgIC8vIEZJWE1FOiBwZXJzaXN0IHRoaXMgc29tZXdoZXJlIHNtYXJ0ZXIgdGhhbiBsb2NhbCBzdG9yYWdlXG4gICAgICAgIGlmIChnbG9iYWwubG9jYWxTdG9yYWdlKSB7XG4gICAgICAgICAgICBnbG9iYWwubG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJoaWRlX3ByZXZpZXdfXCIgKyB0aGlzLnByb3BzLm14RXZlbnQuZ2V0SWQoKSwgXCIxXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICB9LFxuXG4gICAgb25FbW90ZVNlbmRlckNsaWNrOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBjb25zdCBteEV2ZW50ID0gdGhpcy5wcm9wcy5teEV2ZW50O1xuICAgICAgICBkaXMuZGlzcGF0Y2goe1xuICAgICAgICAgICAgYWN0aW9uOiAnaW5zZXJ0X21lbnRpb24nLFxuICAgICAgICAgICAgdXNlcl9pZDogbXhFdmVudC5nZXRTZW5kZXIoKSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGdldEV2ZW50VGlsZU9wczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpc1dpZGdldEhpZGRlbjogKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXRlLndpZGdldEhpZGRlbjtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHVuaGlkZVdpZGdldDogKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyB3aWRnZXRIaWRkZW46IGZhbHNlIH0pO1xuICAgICAgICAgICAgICAgIGlmIChnbG9iYWwubG9jYWxTdG9yYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShcImhpZGVfcHJldmlld19cIiArIHRoaXMucHJvcHMubXhFdmVudC5nZXRJZCgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBvblN0YXJ0ZXJMaW5rQ2xpY2s6IGZ1bmN0aW9uKHN0YXJ0ZXJMaW5rLCBldikge1xuICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvLyBXZSBuZWVkIHRvIGFkZCBvbiBvdXIgc2NhbGFyIHRva2VuIHRvIHRoZSBzdGFydGVyIGxpbmssIGJ1dCB3ZSBtYXkgbm90IGhhdmUgb25lIVxuICAgICAgICAvLyBJbiBhZGRpdGlvbiwgd2UgY2FuJ3QgZmV0Y2ggb25lIG9uIGNsaWNrIGFuZCB0aGVuIGdvIHRvIGl0IGltbWVkaWF0ZWx5IGFzIHRoYXRcbiAgICAgICAgLy8gaXMgdGhlbiB0cmVhdGVkIGFzIGEgcG9wdXAhXG4gICAgICAgIC8vIFdlIGNhbiBnZXQgYXJvdW5kIHRoaXMgYnkgZmV0Y2hpbmcgb25lIG5vdyBhbmQgc2hvd2luZyBhIFwiY29uZmlybWF0aW9uIGRpYWxvZ1wiIChodXJyIGh1cnIpXG4gICAgICAgIC8vIHdoaWNoIHJlcXVpcmVzIHRoZSB1c2VyIHRvIGNsaWNrIHRocm91Z2ggYW5kIFRIRU4gd2UgY2FuIG9wZW4gdGhlIGxpbmsgaW4gYSBuZXcgdGFiIGJlY2F1c2VcbiAgICAgICAgLy8gdGhlIHdpbmRvdy5vcGVuIGNvbW1hbmQgb2NjdXJzIGluIHRoZSBzYW1lIHN0YWNrIGZyYW1lIGFzIHRoZSBvbkNsaWNrIGNhbGxiYWNrLlxuXG4gICAgICAgIGNvbnN0IG1hbmFnZXJzID0gSW50ZWdyYXRpb25NYW5hZ2Vycy5zaGFyZWRJbnN0YW5jZSgpO1xuICAgICAgICBpZiAoIW1hbmFnZXJzLmhhc01hbmFnZXIoKSkge1xuICAgICAgICAgICAgbWFuYWdlcnMub3Blbk5vTWFuYWdlckRpYWxvZygpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR28gZmV0Y2ggYSBzY2FsYXIgdG9rZW5cbiAgICAgICAgY29uc3QgaW50ZWdyYXRpb25NYW5hZ2VyID0gbWFuYWdlcnMuZ2V0UHJpbWFyeU1hbmFnZXIoKTtcbiAgICAgICAgY29uc3Qgc2NhbGFyQ2xpZW50ID0gaW50ZWdyYXRpb25NYW5hZ2VyLmdldFNjYWxhckNsaWVudCgpO1xuICAgICAgICBzY2FsYXJDbGllbnQuY29ubmVjdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29tcGxldGVVcmwgPSBzY2FsYXJDbGllbnQuZ2V0U3RhcnRlckxpbmsoc3RhcnRlckxpbmspO1xuICAgICAgICAgICAgY29uc3QgUXVlc3Rpb25EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5RdWVzdGlvbkRpYWxvZ1wiKTtcbiAgICAgICAgICAgIGNvbnN0IGludGVncmF0aW9uc1VybCA9IGludGVncmF0aW9uTWFuYWdlci51aVVybDtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0FkZCBhbiBpbnRlZ3JhdGlvbicsICcnLCBRdWVzdGlvbkRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIkFkZCBhbiBJbnRlZ3JhdGlvblwiKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoXCJZb3UgYXJlIGFib3V0IHRvIGJlIHRha2VuIHRvIGEgdGhpcmQtcGFydHkgc2l0ZSBzbyB5b3UgY2FuIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImF1dGhlbnRpY2F0ZSB5b3VyIGFjY291bnQgZm9yIHVzZSB3aXRoICUoaW50ZWdyYXRpb25zVXJsKXMuIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkRvIHlvdSB3aXNoIHRvIGNvbnRpbnVlP1wiLCB7IGludGVncmF0aW9uc1VybDogaW50ZWdyYXRpb25zVXJsIH0pIH1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+LFxuICAgICAgICAgICAgICAgIGJ1dHRvbjogX3QoXCJDb250aW51ZVwiKSxcbiAgICAgICAgICAgICAgICBvbkZpbmlzaGVkOiBmdW5jdGlvbihjb25maXJtZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjb25maXJtZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCB3aWR0aCA9IHdpbmRvdy5zY3JlZW4ud2lkdGggPiAxMDI0ID8gMTAyNCA6IHdpbmRvdy5zY3JlZW4ud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IHdpbmRvdy5zY3JlZW4uaGVpZ2h0ID4gODAwID8gODAwIDogd2luZG93LnNjcmVlbi5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxlZnQgPSAod2luZG93LnNjcmVlbi53aWR0aCAtIHdpZHRoKSAvIDI7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvcCA9ICh3aW5kb3cuc2NyZWVuLmhlaWdodCAtIGhlaWdodCkgLyAyO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmZWF0dXJlcyA9IGBoZWlnaHQ9JHtoZWlnaHR9LCB3aWR0aD0ke3dpZHRofSwgdG9wPSR7dG9wfSwgbGVmdD0ke2xlZnR9LGA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHduZCA9IHdpbmRvdy5vcGVuKGNvbXBsZXRlVXJsLCAnX2JsYW5rJywgZmVhdHVyZXMpO1xuICAgICAgICAgICAgICAgICAgICB3bmQub3BlbmVyID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfb25Nb3VzZUVudGVyRWRpdGVkTWFya2VyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7ZWRpdGVkTWFya2VySG92ZXJlZDogdHJ1ZX0pO1xuICAgIH0sXG5cbiAgICBfb25Nb3VzZUxlYXZlRWRpdGVkTWFya2VyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7ZWRpdGVkTWFya2VySG92ZXJlZDogZmFsc2V9KTtcbiAgICB9LFxuXG4gICAgX29wZW5IaXN0b3J5RGlhbG9nOiBhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgTWVzc2FnZUVkaXRIaXN0b3J5RGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcInZpZXdzLmRpYWxvZ3MuTWVzc2FnZUVkaXRIaXN0b3J5RGlhbG9nXCIpO1xuICAgICAgICBNb2RhbC5jcmVhdGVEaWFsb2coTWVzc2FnZUVkaXRIaXN0b3J5RGlhbG9nLCB7bXhFdmVudDogdGhpcy5wcm9wcy5teEV2ZW50fSk7XG4gICAgfSxcblxuICAgIF9yZW5kZXJFZGl0ZWRNYXJrZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgZWRpdGVkVG9vbHRpcDtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZWRpdGVkTWFya2VySG92ZXJlZCkge1xuICAgICAgICAgICAgY29uc3QgVG9vbHRpcCA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLlRvb2x0aXAnKTtcbiAgICAgICAgICAgIGNvbnN0IGRhdGUgPSB0aGlzLnByb3BzLm14RXZlbnQucmVwbGFjaW5nRXZlbnREYXRlKCk7XG4gICAgICAgICAgICBjb25zdCBkYXRlU3RyaW5nID0gZGF0ZSAmJiBmb3JtYXREYXRlKGRhdGUpO1xuICAgICAgICAgICAgZWRpdGVkVG9vbHRpcCA9IDxUb29sdGlwXG4gICAgICAgICAgICAgICAgdG9vbHRpcENsYXNzTmFtZT1cIm14X1Rvb2x0aXBfdGltZWxpbmVcIlxuICAgICAgICAgICAgICAgIGxhYmVsPXtfdChcIkVkaXRlZCBhdCAlKGRhdGUpcy4gQ2xpY2sgdG8gdmlldyBlZGl0cy5cIiwge2RhdGU6IGRhdGVTdHJpbmd9KX1cbiAgICAgICAgICAgIC8+O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgQWNjZXNzaWJsZUJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkFjY2Vzc2libGVCdXR0b24nKTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uXG4gICAgICAgICAgICAgICAga2V5PVwiZWRpdGVkTWFya2VyXCJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9FdmVudFRpbGVfZWRpdGVkXCJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9vcGVuSGlzdG9yeURpYWxvZ31cbiAgICAgICAgICAgICAgICBvbk1vdXNlRW50ZXI9e3RoaXMuX29uTW91c2VFbnRlckVkaXRlZE1hcmtlcn1cbiAgICAgICAgICAgICAgICBvbk1vdXNlTGVhdmU9e3RoaXMuX29uTW91c2VMZWF2ZUVkaXRlZE1hcmtlcn1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7IGVkaXRlZFRvb2x0aXAgfTxzcGFuPntgKCR7X3QoXCJlZGl0ZWRcIil9KWB9PC9zcGFuPlxuICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5lZGl0U3RhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IEVkaXRNZXNzYWdlQ29tcG9zZXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdyb29tcy5FZGl0TWVzc2FnZUNvbXBvc2VyJyk7XG4gICAgICAgICAgICByZXR1cm4gPEVkaXRNZXNzYWdlQ29tcG9zZXIgZWRpdFN0YXRlPXt0aGlzLnByb3BzLmVkaXRTdGF0ZX0gY2xhc3NOYW1lPVwibXhfRXZlbnRUaWxlX2NvbnRlbnRcIiAvPjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBteEV2ZW50ID0gdGhpcy5wcm9wcy5teEV2ZW50O1xuICAgICAgICBjb25zdCBjb250ZW50ID0gbXhFdmVudC5nZXRDb250ZW50KCk7XG5cbiAgICAgICAgY29uc3Qgc3RyaXBSZXBseSA9IFJlcGx5VGhyZWFkLmdldFBhcmVudEV2ZW50SWQobXhFdmVudCk7XG4gICAgICAgIGxldCBib2R5ID0gSHRtbFV0aWxzLmJvZHlUb0h0bWwoY29udGVudCwgdGhpcy5wcm9wcy5oaWdobGlnaHRzLCB7XG4gICAgICAgICAgICBkaXNhYmxlQmlnRW1vamk6IGNvbnRlbnQubXNndHlwZSA9PT0gXCJtLmVtb3RlXCIgfHwgIVNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoJ1RleHR1YWxCb2R5LmVuYWJsZUJpZ0Vtb2ppJyksXG4gICAgICAgICAgICAvLyBQYXJ0IG9mIFJlcGxpZXMgZmFsbGJhY2sgc3VwcG9ydFxuICAgICAgICAgICAgc3RyaXBSZXBseUZhbGxiYWNrOiBzdHJpcFJlcGx5LFxuICAgICAgICAgICAgcmVmOiB0aGlzLl9jb250ZW50LFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMucmVwbGFjaW5nRXZlbnRJZCkge1xuICAgICAgICAgICAgYm9keSA9IFtib2R5LCB0aGlzLl9yZW5kZXJFZGl0ZWRNYXJrZXIoKV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5wcm9wcy5oaWdobGlnaHRMaW5rKSB7XG4gICAgICAgICAgICBib2R5ID0gPGEgaHJlZj17dGhpcy5wcm9wcy5oaWdobGlnaHRMaW5rfT57IGJvZHkgfTwvYT47XG4gICAgICAgIH0gZWxzZSBpZiAoY29udGVudC5kYXRhICYmIHR5cGVvZiBjb250ZW50LmRhdGFbXCJvcmcubWF0cml4Lm5lYi5zdGFydGVyX2xpbmtcIl0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGJvZHkgPSA8YSBocmVmPVwiI1wiIG9uQ2xpY2s9e3RoaXMub25TdGFydGVyTGlua0NsaWNrLmJpbmQodGhpcywgY29udGVudC5kYXRhW1wib3JnLm1hdHJpeC5uZWIuc3RhcnRlcl9saW5rXCJdKX0+eyBib2R5IH08L2E+O1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHdpZGdldHM7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmxpbmtzLmxlbmd0aCAmJiAhdGhpcy5zdGF0ZS53aWRnZXRIaWRkZW4gJiYgdGhpcy5wcm9wcy5zaG93VXJsUHJldmlldykge1xuICAgICAgICAgICAgY29uc3QgTGlua1ByZXZpZXdXaWRnZXQgPSBzZGsuZ2V0Q29tcG9uZW50KCdyb29tcy5MaW5rUHJldmlld1dpZGdldCcpO1xuICAgICAgICAgICAgd2lkZ2V0cyA9IHRoaXMuc3RhdGUubGlua3MubWFwKChsaW5rKT0+e1xuICAgICAgICAgICAgICAgIHJldHVybiA8TGlua1ByZXZpZXdXaWRnZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2xpbmt9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluaz17bGlua31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBteEV2ZW50PXt0aGlzLnByb3BzLm14RXZlbnR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DYW5jZWxDbGljaz17dGhpcy5vbkNhbmNlbENsaWNrfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uSGVpZ2h0Q2hhbmdlZD17dGhpcy5wcm9wcy5vbkhlaWdodENoYW5nZWR9IC8+O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKGNvbnRlbnQubXNndHlwZSkge1xuICAgICAgICAgICAgY2FzZSBcIm0uZW1vdGVcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9NRW1vdGVCb2R5IG14X0V2ZW50VGlsZV9jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAqJm5ic3A7XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X01FbW90ZUJvZHlfc2VuZGVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uRW1vdGVTZW5kZXJDbGlja31cbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IG14RXZlbnQuc2VuZGVyID8gbXhFdmVudC5zZW5kZXIubmFtZSA6IG14RXZlbnQuZ2V0U2VuZGVyKCkgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgJm5ic3A7XG4gICAgICAgICAgICAgICAgICAgICAgICB7IGJvZHkgfVxuICAgICAgICAgICAgICAgICAgICAgICAgeyB3aWRnZXRzIH1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjYXNlIFwibS5ub3RpY2VcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9NTm90aWNlQm9keSBteF9FdmVudFRpbGVfY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBib2R5IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgd2lkZ2V0cyB9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgZGVmYXVsdDogLy8gaW5jbHVkaW5nIFwibS50ZXh0XCJcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9NVGV4dEJvZHkgbXhfRXZlbnRUaWxlX2NvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgYm9keSB9XG4gICAgICAgICAgICAgICAgICAgICAgICB7IHdpZGdldHMgfVxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH0sXG59KTtcbiJdfQ==