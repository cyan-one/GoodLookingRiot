/*
Copyright 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2019 New Vector Ltd

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

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _browserRequest = _interopRequireDefault(require("browser-request"));

var _languageHandler = require("../../languageHandler");

var _sanitizeHtml = _interopRequireDefault(require("sanitize-html"));

var _dispatcher = _interopRequireDefault(require("../../dispatcher/dispatcher"));

var _MatrixClientPeg = require("../../MatrixClientPeg");

var _classnames = _interopRequireDefault(require("classnames"));

var _MatrixClientContext = _interopRequireDefault(require("../../contexts/MatrixClientContext"));

var _AutoHideScrollbar = _interopRequireDefault(require("./AutoHideScrollbar"));

class EmbeddedPage extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onAction", payload => {
      // HACK: Workaround for the context's MatrixClient not being set up at render time.
      if (payload.action === 'client_started') {
        this.forceUpdate();
      }
    });
    this._dispatcherRef = null;
    this.state = {
      page: ''
    };
  }

  translate(s) {
    // default implementation - skins may wish to extend this
    return (0, _sanitizeHtml.default)((0, _languageHandler._t)(s));
  }

  componentDidMount() {
    this._unmounted = false;

    if (!this.props.url) {
      return;
    } // we use request() to inline the page into the react component
    // so that it can inherit CSS and theming easily rather than mess around
    // with iframes and trying to synchronise document.stylesheets.


    (0, _browserRequest.default)({
      method: "GET",
      url: this.props.url
    }, (err, response, body) => {
      if (this._unmounted) {
        return;
      }

      if (err || response.status < 200 || response.status >= 300) {
        console.warn("Error loading page: ".concat(err));
        this.setState({
          page: (0, _languageHandler._t)("Couldn't load page")
        });
        return;
      }

      body = body.replace(/_t\(['"]([\s\S]*?)['"]\)/mg, (match, g1) => this.translate(g1));

      if (this.props.replaceMap) {
        Object.keys(this.props.replaceMap).forEach(key => {
          body = body.split(key).join(this.props.replaceMap[key]);
        });
      }

      this.setState({
        page: body
      });
    });
    this._dispatcherRef = _dispatcher.default.register(this.onAction);
  }

  componentWillUnmount() {
    this._unmounted = true;
    if (this._dispatcherRef !== null) _dispatcher.default.unregister(this._dispatcherRef);
  }

  render() {
    // HACK: Workaround for the context's MatrixClient not updating.
    const client = this.context || _MatrixClientPeg.MatrixClientPeg.get();

    const isGuest = client ? client.isGuest() : true;
    const className = this.props.className;
    const classes = (0, _classnames.default)({
      [className]: true,
      ["".concat(className, "_guest")]: isGuest,
      ["".concat(className, "_loggedIn")]: !!client
    });

    const content = /*#__PURE__*/_react.default.createElement("div", {
      className: "".concat(className, "_body"),
      dangerouslySetInnerHTML: {
        __html: this.state.page
      }
    });

    if (this.props.scrollbar) {
      return /*#__PURE__*/_react.default.createElement(_AutoHideScrollbar.default, {
        className: classes
      }, content);
    } else {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: classes
      }, content);
    }
  }

}

exports.default = EmbeddedPage;
(0, _defineProperty2.default)(EmbeddedPage, "propTypes", {
  // URL to request embedded page content from
  url: _propTypes.default.string,
  // Class name prefix to apply for a given instance
  className: _propTypes.default.string,
  // Whether to wrap the page in a scrollbar
  scrollbar: _propTypes.default.bool,
  // Map of keys to replace with values, e.g {$placeholder: "value"}
  replaceMap: _propTypes.default.object
});
(0, _defineProperty2.default)(EmbeddedPage, "contextType", _MatrixClientContext.default);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvRW1iZWRkZWRQYWdlLmpzIl0sIm5hbWVzIjpbIkVtYmVkZGVkUGFnZSIsIlJlYWN0IiwiUHVyZUNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJwYXlsb2FkIiwiYWN0aW9uIiwiZm9yY2VVcGRhdGUiLCJfZGlzcGF0Y2hlclJlZiIsInN0YXRlIiwicGFnZSIsInRyYW5zbGF0ZSIsInMiLCJjb21wb25lbnREaWRNb3VudCIsIl91bm1vdW50ZWQiLCJ1cmwiLCJtZXRob2QiLCJlcnIiLCJyZXNwb25zZSIsImJvZHkiLCJzdGF0dXMiLCJjb25zb2xlIiwid2FybiIsInNldFN0YXRlIiwicmVwbGFjZSIsIm1hdGNoIiwiZzEiLCJyZXBsYWNlTWFwIiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJrZXkiLCJzcGxpdCIsImpvaW4iLCJkaXMiLCJyZWdpc3RlciIsIm9uQWN0aW9uIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJ1bnJlZ2lzdGVyIiwicmVuZGVyIiwiY2xpZW50IiwiY29udGV4dCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImlzR3Vlc3QiLCJjbGFzc05hbWUiLCJjbGFzc2VzIiwiY29udGVudCIsIl9faHRtbCIsInNjcm9sbGJhciIsIlByb3BUeXBlcyIsInN0cmluZyIsImJvb2wiLCJvYmplY3QiLCJNYXRyaXhDbGllbnRDb250ZXh0Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkE7Ozs7Ozs7Ozs7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRWUsTUFBTUEsWUFBTixTQUEyQkMsZUFBTUMsYUFBakMsQ0FBK0M7QUFjMURDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFRO0FBQ2YsVUFBTUEsS0FBTjtBQURlLG9EQTJEUEMsT0FBRCxJQUFhO0FBQ3BCO0FBQ0EsVUFBSUEs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QUF1QixFQUFFO0FBQUVHLFFBQUFBLE1BQU0sRUFBRSxLQUFLdkMsS0FBTCxDQUFXQztBQUFyQjtBQURiLE1BQWhCOztBQUtBLFFBQUksS0FBS04sS0FBTCxDQUFXNkMsU0FBZixFQUEwQjtBQUN0QiwwQkFBTyw2QkFBQywwQkFBRDtBQUFtQixRQUFBLFNBQVMsRUFBRUg7QUFBOUIsU0FDRkMsT0FERSxDQUFQO0FBR0gsS0FKRCxNQUlPO0FBQ0gsMEJBQU87QUFBSyxRQUFBLFNBQVMsRUFBRUQ7QUFBaEIsU0FDRkMsT0FERSxDQUFQO0FBR0g7QUFDSjs7QUF6R3lEOzs7OEJBQXpDL0MsWSxlQUNFO0FBQ2Y7QUFDQWUsRUFBQUEsR0FBRyxFQUFFbUMsbUJBQVVDLE1BRkE7QUFHZjtBQUNBTixFQUFBQSxTQUFTLEVBQUVLLG1CQUFVQyxNQUpOO0FBS2Y7QUFDQUYsRUFBQUEsU0FBUyxFQUFFQyxtQkFBVUUsSUFOTjtBQU9mO0FBQ0F6QixFQUFBQSxVQUFVLEVBQUV1QixtQkFBVUc7QUFSUCxDOzhCQURGckQsWSxpQkFZSXNELDRCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxNyBWZWN0b3IgQ3JlYXRpb25zIEx0ZFxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHJlcXVlc3QgZnJvbSAnYnJvd3Nlci1yZXF1ZXN0JztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBzYW5pdGl6ZUh0bWwgZnJvbSAnc2FuaXRpemUtaHRtbCc7XG5pbXBvcnQgZGlzIGZyb20gJy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuaW1wb3J0IE1hdHJpeENsaWVudENvbnRleHQgZnJvbSBcIi4uLy4uL2NvbnRleHRzL01hdHJpeENsaWVudENvbnRleHRcIjtcbmltcG9ydCBBdXRvSGlkZVNjcm9sbGJhciBmcm9tIFwiLi9BdXRvSGlkZVNjcm9sbGJhclwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFbWJlZGRlZFBhZ2UgZXh0ZW5kcyBSZWFjdC5QdXJlQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICAvLyBVUkwgdG8gcmVxdWVzdCBlbWJlZGRlZCBwYWdlIGNvbnRlbnQgZnJvbVxuICAgICAgICB1cmw6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIC8vIENsYXNzIG5hbWUgcHJlZml4IHRvIGFwcGx5IGZvciBhIGdpdmVuIGluc3RhbmNlXG4gICAgICAgIGNsYXNzTmFtZTogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgLy8gV2hldGhlciB0byB3cmFwIHRoZSBwYWdlIGluIGEgc2Nyb2xsYmFyXG4gICAgICAgIHNjcm9sbGJhcjogUHJvcFR5cGVzLmJvb2wsXG4gICAgICAgIC8vIE1hcCBvZiBrZXlzIHRvIHJlcGxhY2Ugd2l0aCB2YWx1ZXMsIGUuZyB7JHBsYWNlaG9sZGVyOiBcInZhbHVlXCJ9XG4gICAgICAgIHJlcGxhY2VNYXA6IFByb3BUeXBlcy5vYmplY3QsXG4gICAgfTtcblxuICAgIHN0YXRpYyBjb250ZXh0VHlwZSA9IE1hdHJpeENsaWVudENvbnRleHQ7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5fZGlzcGF0Y2hlclJlZiA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHBhZ2U6ICcnLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHRyYW5zbGF0ZShzKSB7XG4gICAgICAgIC8vIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gLSBza2lucyBtYXkgd2lzaCB0byBleHRlbmQgdGhpc1xuICAgICAgICByZXR1cm4gc2FuaXRpemVIdG1sKF90KHMpKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgdGhpcy5fdW5tb3VudGVkID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKCF0aGlzLnByb3BzLnVybCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gd2UgdXNlIHJlcXVlc3QoKSB0byBpbmxpbmUgdGhlIHBhZ2UgaW50byB0aGUgcmVhY3QgY29tcG9uZW50XG4gICAgICAgIC8vIHNvIHRoYXQgaXQgY2FuIGluaGVyaXQgQ1NTIGFuZCB0aGVtaW5nIGVhc2lseSByYXRoZXIgdGhhbiBtZXNzIGFyb3VuZFxuICAgICAgICAvLyB3aXRoIGlmcmFtZXMgYW5kIHRyeWluZyB0byBzeW5jaHJvbmlzZSBkb2N1bWVudC5zdHlsZXNoZWV0cy5cblxuICAgICAgICByZXF1ZXN0KFxuICAgICAgICAgICAgeyBtZXRob2Q6IFwiR0VUXCIsIHVybDogdGhpcy5wcm9wcy51cmwgfSxcbiAgICAgICAgICAgIChlcnIsIHJlc3BvbnNlLCBib2R5KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3VubW91bnRlZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGVyciB8fCByZXNwb25zZS5zdGF0dXMgPCAyMDAgfHwgcmVzcG9uc2Uuc3RhdHVzID49IDMwMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEVycm9yIGxvYWRpbmcgcGFnZTogJHtlcnJ9YCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyBwYWdlOiBfdChcIkNvdWxkbid0IGxvYWQgcGFnZVwiKSB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGJvZHkgPSBib2R5LnJlcGxhY2UoL190XFwoWydcIl0oW1xcc1xcU10qPylbJ1wiXVxcKS9tZywgKG1hdGNoLCBnMSk9PnRoaXMudHJhbnNsYXRlKGcxKSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5yZXBsYWNlTWFwKSB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHRoaXMucHJvcHMucmVwbGFjZU1hcCkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9keSA9IGJvZHkuc3BsaXQoa2V5KS5qb2luKHRoaXMucHJvcHMucmVwbGFjZU1hcFtrZXldKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IHBhZ2U6IGJvZHkgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuX2Rpc3BhdGNoZXJSZWYgPSBkaXMucmVnaXN0ZXIodGhpcy5vbkFjdGlvbik7XG4gICAgfVxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIHRoaXMuX3VubW91bnRlZCA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLl9kaXNwYXRjaGVyUmVmICE9PSBudWxsKSBkaXMudW5yZWdpc3Rlcih0aGlzLl9kaXNwYXRjaGVyUmVmKTtcbiAgICB9XG5cbiAgICBvbkFjdGlvbiA9IChwYXlsb2FkKSA9PiB7XG4gICAgICAgIC8vIEhBQ0s6IFdvcmthcm91bmQgZm9yIHRoZSBjb250ZXh0J3MgTWF0cml4Q2xpZW50IG5vdCBiZWluZyBzZXQgdXAgYXQgcmVuZGVyIHRpbWUuXG4gICAgICAgIGlmIChwYXlsb2FkLmFjdGlvbiA9PT0gJ2NsaWVudF9zdGFydGVkJykge1xuICAgICAgICAgICAgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgLy8gSEFDSzogV29ya2Fyb3VuZCBmb3IgdGhlIGNvbnRleHQncyBNYXRyaXhDbGllbnQgbm90IHVwZGF0aW5nLlxuICAgICAgICBjb25zdCBjbGllbnQgPSB0aGlzLmNvbnRleHQgfHwgTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBjb25zdCBpc0d1ZXN0ID0gY2xpZW50ID8gY2xpZW50LmlzR3Vlc3QoKSA6IHRydWU7XG4gICAgICAgIGNvbnN0IGNsYXNzTmFtZSA9IHRoaXMucHJvcHMuY2xhc3NOYW1lO1xuICAgICAgICBjb25zdCBjbGFzc2VzID0gY2xhc3NuYW1lcyh7XG4gICAgICAgICAgICBbY2xhc3NOYW1lXTogdHJ1ZSxcbiAgICAgICAgICAgIFtgJHtjbGFzc05hbWV9X2d1ZXN0YF06IGlzR3Vlc3QsXG4gICAgICAgICAgICBbYCR7Y2xhc3NOYW1lfV9sb2dnZWRJbmBdOiAhIWNsaWVudCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgY29udGVudCA9IDxkaXYgY2xhc3NOYW1lPXtgJHtjbGFzc05hbWV9X2JvZHlgfVxuICAgICAgICAgICAgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3sgX19odG1sOiB0aGlzLnN0YXRlLnBhZ2UgfX1cbiAgICAgICAgPlxuICAgICAgICA8L2Rpdj47XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMuc2Nyb2xsYmFyKSB7XG4gICAgICAgICAgICByZXR1cm4gPEF1dG9IaWRlU2Nyb2xsYmFyIGNsYXNzTmFtZT17Y2xhc3Nlc30+XG4gICAgICAgICAgICAgICAge2NvbnRlbnR9XG4gICAgICAgICAgICA8L0F1dG9IaWRlU2Nyb2xsYmFyPjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc30+XG4gICAgICAgICAgICAgICAge2NvbnRlbnR9XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=