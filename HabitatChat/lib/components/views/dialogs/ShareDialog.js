"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var React = _interopRequireWildcard(require("react"));

var PropTypes = _interopRequireWildcard(require("prop-types"));

var _room = require("matrix-js-sdk/src/models/room");

var _user = require("matrix-js-sdk/src/models/user");

var _group = require("matrix-js-sdk/src/models/group");

var _roomMember = require("matrix-js-sdk/src/models/room-member");

var _event = require("matrix-js-sdk/src/models/event");

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _QRCode = _interopRequireDefault(require("../elements/QRCode"));

var _Permalinks = require("../../../utils/permalinks/Permalinks");

var ContextMenu = _interopRequireWildcard(require("../../structures/ContextMenu"));

var _strings = require("../../../utils/strings");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const socials = [{
  name: 'Facebook',
  img: require("../../../../res/img/social/facebook.png"),
  url: url => "https://www.facebook.com/sharer/sharer.php?u=".concat(url)
}, {
  name: 'Twitter',
  img: require("../../../../res/img/social/twitter-2.png"),
  url: url => "https://twitter.com/home?status=".concat(url)
},
/* // icon missing
 name: 'Google Plus',
 img: 'img/social/',
 url: (url) => `https://plus.google.com/share?url=${url}`,
},*/
{
  name: 'LinkedIn',
  img: require("../../../../res/img/social/linkedin.png"),
  url: url => "https://www.linkedin.com/shareArticle?mini=true&url=".concat(url)
}, {
  name: 'Reddit',
  img: require("../../../../res/img/social/reddit.png"),
  url: url => "http://www.reddit.com/submit?url=".concat(url)
}, {
  name: 'email',
  img: require("../../../../res/img/social/email-1.png"),
  url: url => "mailto:?body=".concat(url)
}];

class ShareDialog extends React.PureComponent
/*:: <IProps, IState>*/
{
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "closeCopiedTooltip", void 0);
    this.onCopyClick = this.onCopyClick.bind(this);
    this.onLinkSpecificEventCheckboxClick = this.onLinkSpecificEventCheckboxClick.bind(this);
    let permalinkCreator
    /*: RoomPermalinkCreator*/
    = null;

    if (props.target instanceof _room.Room) {
      permalinkCreator = new _Permalinks.RoomPermalinkCreator(props.target);
      permalinkCreator.load();
    }

    this.state = {
      // MatrixEvent defaults to share linkSpecificEvent
      linkSpecificEvent: this.props.target instanceof _event.MatrixEvent,
      permalinkCreator
    };
  }

  static onLinkClick(e) {
    e.preventDefault();
    (0, _strings.selectText)(e.target);
  }

  async onCopyClick(e) {
    e.preventDefault();
    const target = e.target; // copy target before we go async and React throws it away

    const successful = await (0, _strings.copyPlaintext)(this.getUrl());
    const buttonRect = target.getBoundingClientRect();
    const GenericTextContextMenu = sdk.getComponent('context_menus.GenericTextContextMenu');
    const {
      close
    } = ContextMenu.createMenu(GenericTextContextMenu, _objectSpread({}, (0, ContextMenu.toRightOf)(buttonRect, 2), {
      message: successful ? (0, _languageHandler._t)('Copied!') : (0, _languageHandler._t)('Failed to copy')
    })); // Drop a reference to this close handler for componentWillUnmount

    this.closeCopiedTooltip = target.onmouseleave = close;
  }

  onLinkSpecificEventCheckboxClick() {
    this.setState({
      linkSpecificEvent: !this.state.linkSpecificEvent
    });
  }

  componentWillUnmount() {
    // if the Copied tooltip is open then get rid of it, there are ways to close the modal which wouldn't close
    // the tooltip otherwise, such as pressing Escape or clicking X really quickly
    if (this.closeCopiedTooltip) this.closeCopiedTooltip();
  }

  getUrl() {
    let matrixToUrl;

    if (this.props.target instanceof _room.Room) {
      if (this.state.linkSpecificEvent) {
        const events = this.props.target.getLiveTimeline().getEvents();
        matrixToUrl = this.state.permalinkCreator.forEvent(events[events.length - 1].getId());
      } else {
        matrixToUrl = this.state.permalinkCreator.forRoom();
      }
    } else if (this.props.target instanceof _user.User || this.props.target instanceof _roomMember.RoomMember) {
      matrixToUrl = (0, _Permalinks.makeUserPermalink)(this.props.target.userId);
    } else if (this.props.target instanceof _group.Group) {
      matrixToUrl = (0, _Permalinks.makeGroupPermalink)(this.props.target.groupId);
    } else if (this.props.target instanceof _event.MatrixEvent) {
      if (this.state.linkSpecificEvent) {
        matrixToUrl = this.props.permalinkCreator.forEvent(this.props.target.getId());
      } else {
        matrixToUrl = this.props.permalinkCreator.forRoom();
      }
    }

    return matrixToUrl;
  }

  render() {
    let title;
    let checkbox;

    if (this.props.target instanceof _room.Room) {
      title = (0, _languageHandler._t)('Share Room');
      const events = this.props.target.getLiveTimeline().getEvents();

      if (events.length > 0) {
        checkbox = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
          type: "checkbox",
          id: "mx_ShareDialog_checkbox",
          checked: this.state.linkSpecificEvent,
          onChange: this.onLinkSpecificEventCheckboxClick
        }), /*#__PURE__*/React.createElement("label", {
          htmlFor: "mx_ShareDialog_checkbox"
        }, (0, _languageHandler._t)('Link to most recent message')));
      }
    } else if (this.props.target instanceof _user.User || this.props.target instanceof _roomMember.RoomMember) {
      title = (0, _languageHandler._t)('Share User');
    } else if (this.props.target instanceof _group.Group) {
      title = (0, _languageHandler._t)('Share Community');
    } else if (this.props.target instanceof _event.MatrixEvent) {
      title = (0, _languageHandler._t)('Share Room Message');
      checkbox = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        id: "mx_ShareDialog_checkbox",
        checked: this.state.linkSpecificEvent,
        onClick: this.onLinkSpecificEventCheckboxClick
      }), /*#__PURE__*/React.createElement("label", {
        htmlFor: "mx_ShareDialog_checkbox"
      }, (0, _languageHandler._t)('Link to selected message')));
    }

    const matrixToUrl = this.getUrl();
    const encodedUrl = encodeURIComponent(matrixToUrl);
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    return /*#__PURE__*/React.createElement(BaseDialog, {
      title: title,
      className: "mx_ShareDialog",
      contentId: "mx_Dialog_content",
      onFinished: this.props.onFinished
    }, /*#__PURE__*/React.createElement("div", {
      className: "mx_ShareDialog_content"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mx_ShareDialog_matrixto"
    }, /*#__PURE__*/React.createElement("a", {
      href: matrixToUrl,
      onClick: ShareDialog.onLinkClick,
      className: "mx_ShareDialog_matrixto_link"
    }, matrixToUrl), /*#__PURE__*/React.createElement("a", {
      href: matrixToUrl,
      className: "mx_ShareDialog_matrixto_copy",
      onClick: this.onCopyClick
    }, (0, _languageHandler._t)('COPY'), /*#__PURE__*/React.createElement("div", null, "\xA0"))), checkbox, /*#__PURE__*/React.createElement("hr", null), /*#__PURE__*/React.createElement("div", {
      className: "mx_ShareDialog_split"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mx_ShareDialog_qrcode_container"
    }, /*#__PURE__*/React.createElement(_QRCode.default, {
      data: matrixToUrl,
      width: 256
    })), /*#__PURE__*/React.createElement("div", {
      className: "mx_ShareDialog_social_container"
    }, socials.map(social => /*#__PURE__*/React.createElement("a", {
      rel: "noreferrer noopener",
      target: "_blank",
      key: social.name,
      title: social.name,
      href: social.url(encodedUrl),
      className: "mx_ShareDialog_social_icon"
    }, /*#__PURE__*/React.createElement("img", {
      src: social.img,
      alt: social.name,
      height: 64,
      width: 64
    })))))));
  }

}

exports.default = ShareDialog;
(0, _defineProperty2.default)(ShareDialog, "propTypes", {
  onFinished: PropTypes.func.isRequired,
  target: PropTypes.oneOfType([PropTypes.instanceOf(_room.Room), PropTypes.instanceOf(_user.User), PropTypes.instanceOf(_group.Group), PropTypes.instanceOf(_roomMember.RoomMember), PropTypes.instanceOf(_event.MatrixEvent)]).isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvU2hhcmVEaWFsb2cudHN4Il0sIm5hbWVzIjpbInNvY2lhbHMiLCJuYW1lIiwiaW1nIiwicmVxdWlyZSIsInVybCIsIlNoYXJlRGlhbG9nIiwiUmVhY3QiLCJQdXJlQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsIm9uQ29weUNsaWNrIiwiYmluZCIsIm9uTGlua1NwZWNpZmljRXZlbnRDaGVja2JveENsaWNrIiwicGVybWFsaW5rQ3JlYXRvciIsInRhcmdldCIsIlJvb20iLCJSb29tUGVybWFsaW5rQ3JlYXRvciIsImxvYWQiLCJzdGF0ZSIsImxpbmtTcGVjaWZpY0V2ZW50IiwiTWF0cml4RXZlbnQiLCJvbkxpbmtDbGljayIsImUiLCJwcmV2ZW50RGVmYXVsdCIsInN1Y2Nlc3NmdWwiLCJnZXRVcmwiLCJidXR0b25SZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwiR2VuZXJpY1RleHRDb250ZXh0TWVudSIsInNkayIsImdldENvbXBvbmVudCIsImNsb3NlIiwiQ29udGV4dE1lbnUiLCJjcmVhdGVNZW51IiwibWVzc2FnZSIsImNsb3NlQ29waWVkVG9vbHRpcCIsIm9ubW91c2VsZWF2ZSIsInNldFN0YXRlIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJtYXRyaXhUb1VybCIsImV2ZW50cyIsImdldExpdmVUaW1lbGluZSIsImdldEV2ZW50cyIsImZvckV2ZW50IiwibGVuZ3RoIiwiZ2V0SWQiLCJmb3JSb29tIiwiVXNlciIsIlJvb21NZW1iZXIiLCJ1c2VySWQiLCJHcm91cCIsImdyb3VwSWQiLCJyZW5kZXIiLCJ0aXRsZSIsImNoZWNrYm94IiwiZW5jb2RlZFVybCIsImVuY29kZVVSSUNvbXBvbmVudCIsIkJhc2VEaWFsb2ciLCJvbkZpbmlzaGVkIiwibWFwIiwic29jaWFsIiwiUHJvcFR5cGVzIiwiZnVuYyIsImlzUmVxdWlyZWQiLCJvbmVPZlR5cGUiLCJpbnN0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QjtBQUFzQixNQUFBLEdBQUcsRUFBRTBELE1BQU0sQ0FBQzNELElBQWxDO0FBQXdDLE1BQUEsTUFBTSxFQUFFLEVBQWhEO0FBQW9ELE1BQUEsS0FBSyxFQUFFO0FBQTNELE1BUkosQ0FERixDQUROLENBSkosQ0FoQkosQ0FMRyxDQUFQO0FBMENIOztBQTNLd0U7Ozs4QkFBeERJLFcsZUFDRTtBQUNmcUQsRUFBQUEsVUFBVSxFQUFFRyxTQUFTLENBQUNDLElBQVYsQ0FBZUMsVUFEWjtBQUVmakQsRUFBQUEsTUFBTSxFQUFFK0MsU0FBUyxDQUFDRyxTQUFWLENBQW9CLENBQ3hCSCxTQUFTLENBQUNJLFVBQVYsQ0FBcUJsRCxVQUFyQixDQUR3QixFQUV4QjhDLFNBQVMsQ0FBQ0ksVUFBVixDQUFxQmxCLFVBQXJCLENBRndCLEVBR3hCYyxTQUFTLENBQUNJLFVBQVYsQ0FBcUJmLFlBQXJCLENBSHdCLEVBSXhCVyxTQUFTLENBQUNJLFVBQVYsQ0FBcUJqQixzQkFBckIsQ0FKd0IsRUFLeEJhLFNBQVMsQ0FBQ0ksVUFBVixDQUFxQjdDLGtCQUFyQixDQUx3QixDQUFwQixFQU1MMkM7QUFSWSxDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCAqIGFzIFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7Um9vbX0gZnJvbSBcIm1hdHJpeC1qcy1zZGsvc3JjL21vZGVscy9yb29tXCI7XG5pbXBvcnQge1VzZXJ9IGZyb20gXCJtYXRyaXgtanMtc2RrL3NyYy9tb2RlbHMvdXNlclwiO1xuaW1wb3J0IHtHcm91cH0gZnJvbSBcIm1hdHJpeC1qcy1zZGsvc3JjL21vZGVscy9ncm91cFwiO1xuaW1wb3J0IHtSb29tTWVtYmVyfSBmcm9tIFwibWF0cml4LWpzLXNkay9zcmMvbW9kZWxzL3Jvb20tbWVtYmVyXCI7XG5pbXBvcnQge01hdHJpeEV2ZW50fSBmcm9tIFwibWF0cml4LWpzLXNkay9zcmMvbW9kZWxzL2V2ZW50XCI7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IFFSQ29kZSBmcm9tIFwiLi4vZWxlbWVudHMvUVJDb2RlXCI7XG5pbXBvcnQge1Jvb21QZXJtYWxpbmtDcmVhdG9yLCBtYWtlR3JvdXBQZXJtYWxpbmssIG1ha2VVc2VyUGVybWFsaW5rfSBmcm9tIFwiLi4vLi4vLi4vdXRpbHMvcGVybWFsaW5rcy9QZXJtYWxpbmtzXCI7XG5pbXBvcnQgKiBhcyBDb250ZXh0TWVudSBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9Db250ZXh0TWVudVwiO1xuaW1wb3J0IHt0b1JpZ2h0T2Z9IGZyb20gXCIuLi8uLi9zdHJ1Y3R1cmVzL0NvbnRleHRNZW51XCI7XG5pbXBvcnQge2NvcHlQbGFpbnRleHQsIHNlbGVjdFRleHR9IGZyb20gXCIuLi8uLi8uLi91dGlscy9zdHJpbmdzXCI7XG5cbmNvbnN0IHNvY2lhbHMgPSBbXG4gICAge1xuICAgICAgICBuYW1lOiAnRmFjZWJvb2snLFxuICAgICAgICBpbWc6IHJlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL3NvY2lhbC9mYWNlYm9vay5wbmdcIiksXG4gICAgICAgIHVybDogKHVybCkgPT4gYGh0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9zaGFyZXIvc2hhcmVyLnBocD91PSR7dXJsfWAsXG4gICAgfSwge1xuICAgICAgICBuYW1lOiAnVHdpdHRlcicsXG4gICAgICAgIGltZzogcmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvc29jaWFsL3R3aXR0ZXItMi5wbmdcIiksXG4gICAgICAgIHVybDogKHVybCkgPT4gYGh0dHBzOi8vdHdpdHRlci5jb20vaG9tZT9zdGF0dXM9JHt1cmx9YCxcbiAgICB9LCAvKiAvLyBpY29uIG1pc3NpbmdcbiAgICAgICAgbmFtZTogJ0dvb2dsZSBQbHVzJyxcbiAgICAgICAgaW1nOiAnaW1nL3NvY2lhbC8nLFxuICAgICAgICB1cmw6ICh1cmwpID0+IGBodHRwczovL3BsdXMuZ29vZ2xlLmNvbS9zaGFyZT91cmw9JHt1cmx9YCxcbiAgICB9LCovIHtcbiAgICAgICAgbmFtZTogJ0xpbmtlZEluJyxcbiAgICAgICAgaW1nOiByZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9zb2NpYWwvbGlua2VkaW4ucG5nXCIpLFxuICAgICAgICB1cmw6ICh1cmwpID0+IGBodHRwczovL3d3dy5saW5rZWRpbi5jb20vc2hhcmVBcnRpY2xlP21pbmk9dHJ1ZSZ1cmw9JHt1cmx9YCxcbiAgICB9LCB7XG4gICAgICAgIG5hbWU6ICdSZWRkaXQnLFxuICAgICAgICBpbWc6IHJlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL3NvY2lhbC9yZWRkaXQucG5nXCIpLFxuICAgICAgICB1cmw6ICh1cmwpID0+IGBodHRwOi8vd3d3LnJlZGRpdC5jb20vc3VibWl0P3VybD0ke3VybH1gLFxuICAgIH0sIHtcbiAgICAgICAgbmFtZTogJ2VtYWlsJyxcbiAgICAgICAgaW1nOiByZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9zb2NpYWwvZW1haWwtMS5wbmdcIiksXG4gICAgICAgIHVybDogKHVybCkgPT4gYG1haWx0bzo/Ym9keT0ke3VybH1gLFxuICAgIH0sXG5dO1xuXG5pbnRlcmZhY2UgSVByb3BzIHtcbiAgICBvbkZpbmlzaGVkOiAoKSA9PiB2b2lkO1xuICAgIHRhcmdldDogUm9vbSB8IFVzZXIgfCBHcm91cCB8IFJvb21NZW1iZXIgfCBNYXRyaXhFdmVudDtcbiAgICBwZXJtYWxpbmtDcmVhdG9yOiBSb29tUGVybWFsaW5rQ3JlYXRvcjtcbn1cblxuaW50ZXJmYWNlIElTdGF0ZSB7XG4gICAgbGlua1NwZWNpZmljRXZlbnQ6IGJvb2xlYW47XG4gICAgcGVybWFsaW5rQ3JlYXRvcjogUm9vbVBlcm1hbGlua0NyZWF0b3I7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNoYXJlRGlhbG9nIGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudDxJUHJvcHMsIElTdGF0ZT4ge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIG9uRmluaXNoZWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIHRhcmdldDogUHJvcFR5cGVzLm9uZU9mVHlwZShbXG4gICAgICAgICAgICBQcm9wVHlwZXMuaW5zdGFuY2VPZihSb29tKSxcbiAgICAgICAgICAgIFByb3BUeXBlcy5pbnN0YW5jZU9mKFVzZXIpLFxuICAgICAgICAgICAgUHJvcFR5cGVzLmluc3RhbmNlT2YoR3JvdXApLFxuICAgICAgICAgICAgUHJvcFR5cGVzLmluc3RhbmNlT2YoUm9vbU1lbWJlciksXG4gICAgICAgICAgICBQcm9wVHlwZXMuaW5zdGFuY2VPZihNYXRyaXhFdmVudCksXG4gICAgICAgIF0pLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIHByb3RlY3RlZCBjbG9zZUNvcGllZFRvb2x0aXA6ICgpID0+IHZvaWQ7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5vbkNvcHlDbGljayA9IHRoaXMub25Db3B5Q2xpY2suYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vbkxpbmtTcGVjaWZpY0V2ZW50Q2hlY2tib3hDbGljayA9IHRoaXMub25MaW5rU3BlY2lmaWNFdmVudENoZWNrYm94Q2xpY2suYmluZCh0aGlzKTtcblxuICAgICAgICBsZXQgcGVybWFsaW5rQ3JlYXRvcjogUm9vbVBlcm1hbGlua0NyZWF0b3IgPSBudWxsO1xuICAgICAgICBpZiAocHJvcHMudGFyZ2V0IGluc3RhbmNlb2YgUm9vbSkge1xuICAgICAgICAgICAgcGVybWFsaW5rQ3JlYXRvciA9IG5ldyBSb29tUGVybWFsaW5rQ3JlYXRvcihwcm9wcy50YXJnZXQpO1xuICAgICAgICAgICAgcGVybWFsaW5rQ3JlYXRvci5sb2FkKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgLy8gTWF0cml4RXZlbnQgZGVmYXVsdHMgdG8gc2hhcmUgbGlua1NwZWNpZmljRXZlbnRcbiAgICAgICAgICAgIGxpbmtTcGVjaWZpY0V2ZW50OiB0aGlzLnByb3BzLnRhcmdldCBpbnN0YW5jZW9mIE1hdHJpeEV2ZW50LFxuICAgICAgICAgICAgcGVybWFsaW5rQ3JlYXRvcixcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBzdGF0aWMgb25MaW5rQ2xpY2soZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHNlbGVjdFRleHQoZS50YXJnZXQpO1xuICAgIH1cblxuICAgIGFzeW5jIG9uQ29weUNsaWNrKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldDsgLy8gY29weSB0YXJnZXQgYmVmb3JlIHdlIGdvIGFzeW5jIGFuZCBSZWFjdCB0aHJvd3MgaXQgYXdheVxuXG4gICAgICAgIGNvbnN0IHN1Y2Nlc3NmdWwgPSBhd2FpdCBjb3B5UGxhaW50ZXh0KHRoaXMuZ2V0VXJsKCkpO1xuICAgICAgICBjb25zdCBidXR0b25SZWN0ID0gdGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCBHZW5lcmljVGV4dENvbnRleHRNZW51ID0gc2RrLmdldENvbXBvbmVudCgnY29udGV4dF9tZW51cy5HZW5lcmljVGV4dENvbnRleHRNZW51Jyk7XG4gICAgICAgIGNvbnN0IHtjbG9zZX0gPSBDb250ZXh0TWVudS5jcmVhdGVNZW51KEdlbmVyaWNUZXh0Q29udGV4dE1lbnUsIHtcbiAgICAgICAgICAgIC4uLnRvUmlnaHRPZihidXR0b25SZWN0LCAyKSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IHN1Y2Nlc3NmdWwgPyBfdCgnQ29waWVkIScpIDogX3QoJ0ZhaWxlZCB0byBjb3B5JyksXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBEcm9wIGEgcmVmZXJlbmNlIHRvIHRoaXMgY2xvc2UgaGFuZGxlciBmb3IgY29tcG9uZW50V2lsbFVubW91bnRcbiAgICAgICAgdGhpcy5jbG9zZUNvcGllZFRvb2x0aXAgPSB0YXJnZXQub25tb3VzZWxlYXZlID0gY2xvc2U7XG4gICAgfVxuXG4gICAgb25MaW5rU3BlY2lmaWNFdmVudENoZWNrYm94Q2xpY2soKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgbGlua1NwZWNpZmljRXZlbnQ6ICF0aGlzLnN0YXRlLmxpbmtTcGVjaWZpY0V2ZW50LFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgLy8gaWYgdGhlIENvcGllZCB0b29sdGlwIGlzIG9wZW4gdGhlbiBnZXQgcmlkIG9mIGl0LCB0aGVyZSBhcmUgd2F5cyB0byBjbG9zZSB0aGUgbW9kYWwgd2hpY2ggd291bGRuJ3QgY2xvc2VcbiAgICAgICAgLy8gdGhlIHRvb2x0aXAgb3RoZXJ3aXNlLCBzdWNoIGFzIHByZXNzaW5nIEVzY2FwZSBvciBjbGlja2luZyBYIHJlYWxseSBxdWlja2x5XG4gICAgICAgIGlmICh0aGlzLmNsb3NlQ29waWVkVG9vbHRpcCkgdGhpcy5jbG9zZUNvcGllZFRvb2x0aXAoKTtcbiAgICB9XG5cbiAgICBnZXRVcmwoKSB7XG4gICAgICAgIGxldCBtYXRyaXhUb1VybDtcblxuICAgICAgICBpZiAodGhpcy5wcm9wcy50YXJnZXQgaW5zdGFuY2VvZiBSb29tKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5saW5rU3BlY2lmaWNFdmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50cyA9IHRoaXMucHJvcHMudGFyZ2V0LmdldExpdmVUaW1lbGluZSgpLmdldEV2ZW50cygpO1xuICAgICAgICAgICAgICAgIG1hdHJpeFRvVXJsID0gdGhpcy5zdGF0ZS5wZXJtYWxpbmtDcmVhdG9yLmZvckV2ZW50KGV2ZW50c1tldmVudHMubGVuZ3RoIC0gMV0uZ2V0SWQoKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hdHJpeFRvVXJsID0gdGhpcy5zdGF0ZS5wZXJtYWxpbmtDcmVhdG9yLmZvclJvb20oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLnRhcmdldCBpbnN0YW5jZW9mIFVzZXIgfHwgdGhpcy5wcm9wcy50YXJnZXQgaW5zdGFuY2VvZiBSb29tTWVtYmVyKSB7XG4gICAgICAgICAgICBtYXRyaXhUb1VybCA9IG1ha2VVc2VyUGVybWFsaW5rKHRoaXMucHJvcHMudGFyZ2V0LnVzZXJJZCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5wcm9wcy50YXJnZXQgaW5zdGFuY2VvZiBHcm91cCkge1xuICAgICAgICAgICAgbWF0cml4VG9VcmwgPSBtYWtlR3JvdXBQZXJtYWxpbmsodGhpcy5wcm9wcy50YXJnZXQuZ3JvdXBJZCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5wcm9wcy50YXJnZXQgaW5zdGFuY2VvZiBNYXRyaXhFdmVudCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUubGlua1NwZWNpZmljRXZlbnQpIHtcbiAgICAgICAgICAgICAgICBtYXRyaXhUb1VybCA9IHRoaXMucHJvcHMucGVybWFsaW5rQ3JlYXRvci5mb3JFdmVudCh0aGlzLnByb3BzLnRhcmdldC5nZXRJZCgpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWF0cml4VG9VcmwgPSB0aGlzLnByb3BzLnBlcm1hbGlua0NyZWF0b3IuZm9yUm9vbSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXRyaXhUb1VybDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCB0aXRsZTtcbiAgICAgICAgbGV0IGNoZWNrYm94O1xuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLnRhcmdldCBpbnN0YW5jZW9mIFJvb20pIHtcbiAgICAgICAgICAgIHRpdGxlID0gX3QoJ1NoYXJlIFJvb20nKTtcblxuICAgICAgICAgICAgY29uc3QgZXZlbnRzID0gdGhpcy5wcm9wcy50YXJnZXQuZ2V0TGl2ZVRpbWVsaW5lKCkuZ2V0RXZlbnRzKCk7XG4gICAgICAgICAgICBpZiAoZXZlbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjaGVja2JveCA9IDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJteF9TaGFyZURpYWxvZ19jaGVja2JveFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2VkPXt0aGlzLnN0YXRlLmxpbmtTcGVjaWZpY0V2ZW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25MaW5rU3BlY2lmaWNFdmVudENoZWNrYm94Q2xpY2t9IC8+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBodG1sRm9yPVwibXhfU2hhcmVEaWFsb2dfY2hlY2tib3hcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoJ0xpbmsgdG8gbW9zdCByZWNlbnQgbWVzc2FnZScpIH1cbiAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5wcm9wcy50YXJnZXQgaW5zdGFuY2VvZiBVc2VyIHx8IHRoaXMucHJvcHMudGFyZ2V0IGluc3RhbmNlb2YgUm9vbU1lbWJlcikge1xuICAgICAgICAgICAgdGl0bGUgPSBfdCgnU2hhcmUgVXNlcicpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMudGFyZ2V0IGluc3RhbmNlb2YgR3JvdXApIHtcbiAgICAgICAgICAgIHRpdGxlID0gX3QoJ1NoYXJlIENvbW11bml0eScpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMudGFyZ2V0IGluc3RhbmNlb2YgTWF0cml4RXZlbnQpIHtcbiAgICAgICAgICAgIHRpdGxlID0gX3QoJ1NoYXJlIFJvb20gTWVzc2FnZScpO1xuICAgICAgICAgICAgY2hlY2tib3ggPSA8ZGl2PlxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxuICAgICAgICAgICAgICAgICAgICAgICBpZD1cIm14X1NoYXJlRGlhbG9nX2NoZWNrYm94XCJcbiAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZD17dGhpcy5zdGF0ZS5saW5rU3BlY2lmaWNFdmVudH1cbiAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vbkxpbmtTcGVjaWZpY0V2ZW50Q2hlY2tib3hDbGlja30gLz5cbiAgICAgICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj1cIm14X1NoYXJlRGlhbG9nX2NoZWNrYm94XCI+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoJ0xpbmsgdG8gc2VsZWN0ZWQgbWVzc2FnZScpIH1cbiAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWF0cml4VG9VcmwgPSB0aGlzLmdldFVybCgpO1xuICAgICAgICBjb25zdCBlbmNvZGVkVXJsID0gZW5jb2RlVVJJQ29tcG9uZW50KG1hdHJpeFRvVXJsKTtcblxuICAgICAgICBjb25zdCBCYXNlRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZGlhbG9ncy5CYXNlRGlhbG9nJyk7XG4gICAgICAgIHJldHVybiA8QmFzZURpYWxvZyB0aXRsZT17dGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9J214X1NoYXJlRGlhbG9nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudElkPSdteF9EaWFsb2dfY29udGVudCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ9e3RoaXMucHJvcHMub25GaW5pc2hlZH1cbiAgICAgICAgPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9TaGFyZURpYWxvZ19jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9TaGFyZURpYWxvZ19tYXRyaXh0b1wiPlxuICAgICAgICAgICAgICAgICAgICA8YSBocmVmPXttYXRyaXhUb1VybH1cbiAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17U2hhcmVEaWFsb2cub25MaW5rQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X1NoYXJlRGlhbG9nX21hdHJpeHRvX2xpbmtcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IG1hdHJpeFRvVXJsIH1cbiAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgICA8YSBocmVmPXttYXRyaXhUb1VybH0gY2xhc3NOYW1lPVwibXhfU2hhcmVEaWFsb2dfbWF0cml4dG9fY29weVwiIG9uQ2xpY2s9e3RoaXMub25Db3B5Q2xpY2t9PlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBfdCgnQ09QWScpIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+Jm5ic3A7PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7IGNoZWNrYm94IH1cbiAgICAgICAgICAgICAgICA8aHIgLz5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfU2hhcmVEaWFsb2dfc3BsaXRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9TaGFyZURpYWxvZ19xcmNvZGVfY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8UVJDb2RlIGRhdGE9e21hdHJpeFRvVXJsfSB3aWR0aD17MjU2fSAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9TaGFyZURpYWxvZ19zb2NpYWxfY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IHNvY2lhbHMubWFwKChzb2NpYWwpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWw9XCJub3JlZmVycmVyIG5vb3BlbmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0PVwiX2JsYW5rXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtzb2NpYWwubmFtZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e3NvY2lhbC5uYW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBocmVmPXtzb2NpYWwudXJsKGVuY29kZWRVcmwpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9TaGFyZURpYWxvZ19zb2NpYWxfaWNvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17c29jaWFsLmltZ30gYWx0PXtzb2NpYWwubmFtZX0gaGVpZ2h0PXs2NH0gd2lkdGg9ezY0fSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICkpIH1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9CYXNlRGlhbG9nPjtcbiAgICB9XG59XG4iXX0=