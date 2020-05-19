"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var AvatarLogic = _interopRequireWildcard(require("../../../Avatar"));

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

var _MatrixClientContext = _interopRequireDefault(require("../../../contexts/MatrixClientContext"));

var _rem = _interopRequireDefault(require("../../../utils/rem"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2018 New Vector Ltd
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
var _default = (0, _createReactClass.default)({
  displayName: 'BaseAvatar',
  propTypes: {
    name: _propTypes.default.string.isRequired,
    // The name (first initial used as default)
    idName: _propTypes.default.string,
    // ID for generating hash colours
    title: _propTypes.default.string,
    // onHover title text
    url: _propTypes.default.string,
    // highest priority of them all, shortcut to set in urls[0]
    urls: _propTypes.default.array,
    // [highest_priority, ... , lowest_priority]
    width: _propTypes.default.number,
    height: _propTypes.default.number,
    // XXX resizeMethod not actually used.
    resizeMethod: _propTypes.default.string,
    defaultToInitialLetter: _propTypes.default.bool,
    // true to add default url
    inputRef: _propTypes.default.oneOfType([// Either a function
    _propTypes.default.func, // Or the instance of a DOM native element
    _propTypes.default.shape({
      current: _propTypes.default.instanceOf(Element)
    })])
  },
  statics: {
    contextType: _MatrixClientContext.default
  },
  getDefaultProps: function () {
    return {
      width: 40,
      height: 40,
      resizeMethod: 'crop',
      defaultToInitialLetter: true
    };
  },
  getInitialState: function () {
    return this._getState(this.props);
  },

  componentDidMount() {
    this.unmounted = false;
    this.context.on('sync', this.onClientSync);
  },

  componentWillUnmount() {
    this.unmounted = true;
    this.context.removeListener('sync', this.onClientSync);
  },

  // TODO: [REACT-WARNING] Replace with appropriate lifecycle event
  UNSAFE_componentWillReceiveProps: function (nextProps) {
    // work out if we need to call setState (if the image URLs array has changed)
    const newState = this._getState(nextProps);

    const newImageUrls = newState.imageUrls;
    const oldImageUrls = this.state.imageUrls;

    if (newImageUrls.length !== oldImageUrls.length) {
      this.setState(newState); // detected a new entry
    } else {
      // check each one to see if they are the same
      for (let i = 0; i < newImageUrls.length; i++) {
        if (oldImageUrls[i] !== newImageUrls[i]) {
          this.setState(newState); // detected a diff

          break;
        }
      }
    }
  },
  onClientSync: function (syncState, prevState) {
    if (this.unmounted) return; // Consider the client reconnected if there is no error with syncing.
    // This means the state could be RECONNECTING, SYNCING, PREPARED or CATCHUP.

    const reconnected = syncState !== "ERROR" && prevState !== syncState;

    if (reconnected && // Did we fall back?
    this.state.urlsIndex > 0) {
      // Start from the highest priority URL again
      this.setState({
        urlsIndex: 0
      });
    }
  },
  _getState: function (props) {
    // work out the full set of urls to try to load. This is formed like so:
    // imageUrls: [ props.url, props.urls, default image ]
    let urls = [];

    if (!_SettingsStore.default.getValue("lowBandwidth")) {
      urls = props.urls || [];

      if (props.url) {
        urls.unshift(props.url); // put in urls[0]
      }
    }

    let defaultImageUrl = null;

    if (props.defaultToInitialLetter) {
      defaultImageUrl = AvatarLogic.defaultAvatarUrlForString(props.idName || props.name);
      urls.push(defaultImageUrl); // lowest priority
    } // deduplicate URLs


    urls = Array.from(new Set(urls));
    return {
      imageUrls: urls,
      defaultImageUrl: defaultImageUrl,
      urlsIndex: 0
    };
  },
  onError: function (ev) {
    const nextIndex = this.state.urlsIndex + 1;

    if (nextIndex < this.state.imageUrls.length) {
      // try the next one
      this.setState({
        urlsIndex: nextIndex
      });
    }
  },
  render: function () {
    const imageUrl = this.state.imageUrls[this.state.urlsIndex];
    const _this$props = this.props,
          {
      name,
      idName,
      title,
      url,
      urls,
      width,
      height,
      resizeMethod,
      defaultToInitialLetter,
      onClick,
      inputRef
    } = _this$props,
          otherProps = (0, _objectWithoutProperties2.default)(_this$props, ["name", "idName", "title", "url", "urls", "width", "height", "resizeMethod", "defaultToInitialLetter", "onClick", "inputRef"]);

    if (imageUrl === this.state.defaultImageUrl) {
      const initialLetter = AvatarLogic.getInitialLetter(name);

      const textNode = /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_BaseAvatar_initial",
        "aria-hidden": "true",
        style: {
          fontSize: (0, _rem.default)(width * 0.65),
          width: (0, _rem.default)(width),
          lineHeight: (0, _rem.default)(height)
        }
      }, initialLetter);

      const imgNode = /*#__PURE__*/_react.default.createElement("img", {
        className: "mx_BaseAvatar_image",
        src: imageUrl,
        alt: "",
        title: title,
        onError: this.onError,
        "aria-hidden": "true",
        style: {
          width: (0, _rem.default)(width),
          height: (0, _rem.default)(height)
        }
      });

      if (onClick != null) {
        return /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, (0, _extends2.default)({
          element: "span",
          className: "mx_BaseAvatar",
          onClick: onClick,
          inputRef: inputRef
        }, otherProps), textNode, imgNode);
      } else {
        return /*#__PURE__*/_react.default.createElement("span", (0, _extends2.default)({
          className: "mx_BaseAvatar",
          ref: inputRef
        }, otherProps), textNode, imgNode);
      }
    }

    if (onClick != null) {
      return /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, (0, _extends2.default)({
        className: "mx_BaseAvatar mx_BaseAvatar_image",
        element: "img",
        src: imageUrl,
        onClick: onClick,
        onError: this.onError,
        style: {
          width: (0, _rem.default)(width),
          height: (0, _rem.default)(height)
        },
        title: title,
        alt: "",
        inputRef: inputRef
      }, otherProps));
    } else {
      return /*#__PURE__*/_react.default.createElement("img", (0, _extends2.default)({
        className: "mx_BaseAvatar mx_BaseAvatar_image",
        src: imageUrl,
        onError: this.onError,
        style: {
          width: (0, _rem.default)(width),
          height: (0, _rem.default)(height)
        },
        title: title,
        alt: "",
        ref: inputRef
      }, otherProps));
    }
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2F2YXRhcnMvQmFzZUF2YXRhci5qcyJdLCJuYW1lcyI6WyJkaXNwbGF5TmFtZSIsInByb3BUeXBlcyIsIm5hbWUiLCJQcm9wVHlwZXMiLCJzdHJpbmciLCJpc1JlcXVpcmVkIiwiaWROYW1lIiwidGl0bGUiLCJ1cmwiLCJ1cmxzIiwiYXJyYXkiLCJ3aWR0aCIsIm51bWJlciIsImhlaWdodCIsInJlc2l6ZU1ldGhvZCIsImRlZmF1bHRUb0luaXRpYWxMZXR0ZXIiLCJib29sIiwiaW5wdXRSZWYiLCJvbmVPZlR5cGUiLCJmdW5jIiwic2hhcGUiLCJjdXJyZW50IiwiaW5zdGFuY2VPZiIsIkVsZW1lbnQiLCJzdGF0aWNzIiwiY29udGV4dFR5cGUiLCJNYXRyaXhDbGllbnRDb250ZXh0IiwiZ2V0RGVmYXVsdFByb3BzIiwiZ2V0SW5pdGlhbFN0YXRlIiwiX2dldFN0YXRlIiwicHJvcHMiLCJjb21wb25lbnREaWRNb3VudCIsInVubW91bnRlZCIsImNvbnRleHQiLCJvbiIsIm9uQ2xpZW50U3luYyIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwicmVtb3ZlTGlzdGVuZXIiLCJVTlNBRkVfY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyIsIm5leHRQcm9wcyIsIm5ld1N0YXRlIiwibmV3SW1hZ2VVcmxzIiwiaW1hZ2VVcmxzIiwib2xkSW1hZ2VVcmxzIiwic3RhdGUiLCJsZW5ndGgiLCJzZXRTdGF0ZSIsImkiLCJzeW5jU3RhdGUiLCJwcmV2U3RhdGUiLCJyZWNvbm5lY3RlZCIsInVybHNJbmRleCIsIlNldHRpbmdzU3RvcmUiLCJnZXRWYWx1ZSIsInVuc2hpZnQiLCJkZWZhdWx0SW1hZ2VVcmwiLCJBdmF0YXJMb2dpYyIsImRlZmF1bHRBdmF0YXJVcmxGb3JTdHJpbmciLCJwdXNoIiwiQXJyYXkiLCJmcm9tIiwiU2V0Iiwib25FcnJvciIsImV2IiwibmV4dEluZGV4IiwicmVuZGVyIiwiaW1hZ2VVcmwiLCJvbkNsaWNrIiwib3RoZXJQcm9wcyIsImluaXRpYWxMZXR0ZXIiLCJnZXRJbml0aWFsTGV0dGVyIiwidGV4dE5vZGUiLCJmb250U2l6ZSIsImxpbmVIZWlnaHQiLCJpbWdOb2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFtQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBMUJBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7ZUE0QmUsK0JBQWlCO0FBQzVCQSxFQUFBQSxXQUFXLEVBQUUsWUFEZTtBQUc1QkMsRUFBQUEsU0FBUyxFQUFFO0FBQ1BDLElBQUFBLElBQUksRUFBRUMsbUJBQVVDLE1BQVYsQ0FBaUJDLFVBRGhCO0FBQzRCO0FBQ25DQyxJQUFBQSxNQUFNLEVBQUVILG1CQUFVQyxNQUZYO0FBRW1CO0FBQzFCRyxJQUFBQSxLQUFLLEVBQUVKLG1CQUFVQyxNQUhWO0FBR2tCO0FBQ3pCSSxJQUFBQSxHQUFHLEVBQUVMLG1CQUFVQyxNQUpSO0FBSWdCO0FBQ3ZCSyxJQUFBQSxJQUFJLEVBQUVOLG1CQUFVTyxLQUxUO0FBS2dCO0FBQ3ZCQyxJQUFBQSxLQUFLLEVBQUVSLG1CQUFVUyxNQU5WO0FBT1BDLElBQUFBLE1BQU0sRUFBRVYsbUJBQVVTLE1BUFg7QUFRUDtBQUNBRSxJQUFBQSxZQUFZLEVBQUVYLG1CQUFVQyxNQVRqQjtBQVVQVyxJQUFBQSxzQkFBc0IsRUFBRVosbUJBQVVhLElBVjNCO0FBVWlDO0FBQ3hDQyxJQUFBQSxRQUFRLEVBQUVkLG1CQUFVZSxTQUFWLENBQW9CLENBQzFCO0FBQ0FmLHVCQUFVZ0IsSUFGZ0IsRUFHMUI7QUFDQWhCLHVCQUFVaUIsS0FBVixDQUFnQjtBQUFFQyxNQUFBQSxPQUFPLEVBQUVsQixtQkFBVW1CLFVBQVYsQ0FBcUJDLE9BQXJCO0FBQVgsS0FBaEIsQ0FKMEIsQ0FBcEI7QUFYSCxHQUhpQjtBQXNCNUJDLEVBQUFBLE9BQU8sRUFBRTtBQUNMQyxJQUFBQSxXQUFXLEVBQUVDO0FBRFIsR0F0Qm1CO0FBMEI1QkMsRUFBQUEs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RCxVQUFuRCxHQUNNRyxRQUROLEVBRU1HLE9BRk4sQ0FESjtBQU1IO0FBQ0o7O0FBQ0QsUUFBSVAsT0FBTyxJQUFJLElBQWYsRUFBcUI7QUFDakIsMEJBQ0ksNkJBQUMseUJBQUQ7QUFDSSxRQUFBLFNBQVMsRUFBQyxtQ0FEZDtBQUVJLFFBQUEsT0FBTyxFQUFDLEtBRlo7QUFHSSxRQUFBLEdBQUcsRUFBRUQsUUFIVDtBQUlJLFFBQUEsT0FBTyxFQUFFQyxPQUpiO0FBS0ksUUFBQSxPQUFPLEVBQUUsS0FBS0wsT0FMbEI7QUFNSSxRQUFBLEtBQUssRUFBRTtBQUNIbkQsVUFBQUEsS0FBSyxFQUFFLGtCQUFNQSxLQUFOLENBREo7QUFFSEUsVUFBQUEsTUFBTSxFQUFFLGtCQUFNQSxNQUFOO0FBRkwsU0FOWDtBQVVJLFFBQUEsS0FBSyxFQUFFTixLQVZYO0FBVWtCLFFBQUEsR0FBRyxFQUFDLEVBVnRCO0FBV0ksUUFBQSxRQUFRLEVBQUVVO0FBWGQsU0FZUW1ELFVBWlIsRUFESjtBQWVILEtBaEJELE1BZ0JPO0FBQ0gsMEJBQ0k7QUFDSSxRQUFBLFNBQVMsRUFBQyxtQ0FEZDtBQUVJLFFBQUEsR0FBRyxFQUFFRixRQUZUO0FBR0ksUUFBQSxPQUFPLEVBQUUsS0FBS0osT0FIbEI7QUFJSSxRQUFBLEtBQUssRUFBRTtBQUNIbkQsVUFBQUEsS0FBSyxFQUFFLGtCQUFNQSxLQUFOLENBREo7QUFFSEUsVUFBQUEsTUFBTSxFQUFFLGtCQUFNQSxNQUFOO0FBRkwsU0FKWDtBQVFJLFFBQUEsS0FBSyxFQUFFTixLQVJYO0FBUWtCLFFBQUEsR0FBRyxFQUFDLEVBUnRCO0FBU0ksUUFBQSxHQUFHLEVBQUVVO0FBVFQsU0FVUW1ELFVBVlIsRUFESjtBQWFIO0FBQ0o7QUE5TTJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOSBNaWNoYWVsIFRlbGF0eW5za2kgPDd0M2NoZ3V5QGdtYWlsLmNvbT5cbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0ICogYXMgQXZhdGFyTG9naWMgZnJvbSAnLi4vLi4vLi4vQXZhdGFyJztcbmltcG9ydCBTZXR0aW5nc1N0b3JlIGZyb20gXCIuLi8uLi8uLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlXCI7XG5pbXBvcnQgQWNjZXNzaWJsZUJ1dHRvbiBmcm9tICcuLi9lbGVtZW50cy9BY2Nlc3NpYmxlQnV0dG9uJztcbmltcG9ydCBNYXRyaXhDbGllbnRDb250ZXh0IGZyb20gXCIuLi8uLi8uLi9jb250ZXh0cy9NYXRyaXhDbGllbnRDb250ZXh0XCI7XG5pbXBvcnQgdG9SZW0gZnJvbSBcIi4uLy4uLy4uL3V0aWxzL3JlbVwiO1xuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ0Jhc2VBdmF0YXInLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIG5hbWU6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCwgLy8gVGhlIG5hbWUgKGZpcnN0IGluaXRpYWwgdXNlZCBhcyBkZWZhdWx0KVxuICAgICAgICBpZE5hbWU6IFByb3BUeXBlcy5zdHJpbmcsIC8vIElEIGZvciBnZW5lcmF0aW5nIGhhc2ggY29sb3Vyc1xuICAgICAgICB0aXRsZTogUHJvcFR5cGVzLnN0cmluZywgLy8gb25Ib3ZlciB0aXRsZSB0ZXh0XG4gICAgICAgIHVybDogUHJvcFR5cGVzLnN0cmluZywgLy8gaGlnaGVzdCBwcmlvcml0eSBvZiB0aGVtIGFsbCwgc2hvcnRjdXQgdG8gc2V0IGluIHVybHNbMF1cbiAgICAgICAgdXJsczogUHJvcFR5cGVzLmFycmF5LCAvLyBbaGlnaGVzdF9wcmlvcml0eSwgLi4uICwgbG93ZXN0X3ByaW9yaXR5XVxuICAgICAgICB3aWR0aDogUHJvcFR5cGVzLm51bWJlcixcbiAgICAgICAgaGVpZ2h0OiBQcm9wVHlwZXMubnVtYmVyLFxuICAgICAgICAvLyBYWFggcmVzaXplTWV0aG9kIG5vdCBhY3R1YWxseSB1c2VkLlxuICAgICAgICByZXNpemVNZXRob2Q6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIGRlZmF1bHRUb0luaXRpYWxMZXR0ZXI6IFByb3BUeXBlcy5ib29sLCAvLyB0cnVlIHRvIGFkZCBkZWZhdWx0IHVybFxuICAgICAgICBpbnB1dFJlZjogUHJvcFR5cGVzLm9uZU9mVHlwZShbXG4gICAgICAgICAgICAvLyBFaXRoZXIgYSBmdW5jdGlvblxuICAgICAgICAgICAgUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgICAgICAvLyBPciB0aGUgaW5zdGFuY2Ugb2YgYSBET00gbmF0aXZlIGVsZW1lbnRcbiAgICAgICAgICAgIFByb3BUeXBlcy5zaGFwZSh7IGN1cnJlbnQ6IFByb3BUeXBlcy5pbnN0YW5jZU9mKEVsZW1lbnQpIH0pLFxuICAgICAgICBdKSxcbiAgICB9LFxuXG4gICAgc3RhdGljczoge1xuICAgICAgICBjb250ZXh0VHlwZTogTWF0cml4Q2xpZW50Q29udGV4dCxcbiAgICB9LFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiA0MCxcbiAgICAgICAgICAgIGhlaWdodDogNDAsXG4gICAgICAgICAgICByZXNpemVNZXRob2Q6ICdjcm9wJyxcbiAgICAgICAgICAgIGRlZmF1bHRUb0luaXRpYWxMZXR0ZXI6IHRydWUsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRTdGF0ZSh0aGlzLnByb3BzKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIHRoaXMudW5tb3VudGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY29udGV4dC5vbignc3luYycsIHRoaXMub25DbGllbnRTeW5jKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIHRoaXMudW5tb3VudGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5jb250ZXh0LnJlbW92ZUxpc3RlbmVyKCdzeW5jJywgdGhpcy5vbkNsaWVudFN5bmMpO1xuICAgIH0sXG5cbiAgICAvLyBUT0RPOiBbUkVBQ1QtV0FSTklOR10gUmVwbGFjZSB3aXRoIGFwcHJvcHJpYXRlIGxpZmVjeWNsZSBldmVudFxuICAgIFVOU0FGRV9jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbihuZXh0UHJvcHMpIHtcbiAgICAgICAgLy8gd29yayBvdXQgaWYgd2UgbmVlZCB0byBjYWxsIHNldFN0YXRlIChpZiB0aGUgaW1hZ2UgVVJMcyBhcnJheSBoYXMgY2hhbmdlZClcbiAgICAgICAgY29uc3QgbmV3U3RhdGUgPSB0aGlzLl9nZXRTdGF0ZShuZXh0UHJvcHMpO1xuICAgICAgICBjb25zdCBuZXdJbWFnZVVybHMgPSBuZXdTdGF0ZS5pbWFnZVVybHM7XG4gICAgICAgIGNvbnN0IG9sZEltYWdlVXJscyA9IHRoaXMuc3RhdGUuaW1hZ2VVcmxzO1xuICAgICAgICBpZiAobmV3SW1hZ2VVcmxzLmxlbmd0aCAhPT0gb2xkSW1hZ2VVcmxzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZShuZXdTdGF0ZSk7IC8vIGRldGVjdGVkIGEgbmV3IGVudHJ5XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBjaGVjayBlYWNoIG9uZSB0byBzZWUgaWYgdGhleSBhcmUgdGhlIHNhbWVcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmV3SW1hZ2VVcmxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9sZEltYWdlVXJsc1tpXSAhPT0gbmV3SW1hZ2VVcmxzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUobmV3U3RhdGUpOyAvLyBkZXRlY3RlZCBhIGRpZmZcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uQ2xpZW50U3luYzogZnVuY3Rpb24oc3luY1N0YXRlLCBwcmV2U3RhdGUpIHtcbiAgICAgICAgaWYgKHRoaXMudW5tb3VudGVkKSByZXR1cm47XG5cbiAgICAgICAgLy8gQ29uc2lkZXIgdGhlIGNsaWVudCByZWNvbm5lY3RlZCBpZiB0aGVyZSBpcyBubyBlcnJvciB3aXRoIHN5bmNpbmcuXG4gICAgICAgIC8vIFRoaXMgbWVhbnMgdGhlIHN0YXRlIGNvdWxkIGJlIFJFQ09OTkVDVElORywgU1lOQ0lORywgUFJFUEFSRUQgb3IgQ0FUQ0hVUC5cbiAgICAgICAgY29uc3QgcmVjb25uZWN0ZWQgPSBzeW5jU3RhdGUgIT09IFwiRVJST1JcIiAmJiBwcmV2U3RhdGUgIT09IHN5bmNTdGF0ZTtcbiAgICAgICAgaWYgKHJlY29ubmVjdGVkICYmXG4gICAgICAgICAgICAvLyBEaWQgd2UgZmFsbCBiYWNrP1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS51cmxzSW5kZXggPiAwXG4gICAgICAgICkge1xuICAgICAgICAgICAgLy8gU3RhcnQgZnJvbSB0aGUgaGlnaGVzdCBwcmlvcml0eSBVUkwgYWdhaW5cbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHVybHNJbmRleDogMCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9nZXRTdGF0ZTogZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgICAgLy8gd29yayBvdXQgdGhlIGZ1bGwgc2V0IG9mIHVybHMgdG8gdHJ5IHRvIGxvYWQuIFRoaXMgaXMgZm9ybWVkIGxpa2Ugc286XG4gICAgICAgIC8vIGltYWdlVXJsczogWyBwcm9wcy51cmwsIHByb3BzLnVybHMsIGRlZmF1bHQgaW1hZ2UgXVxuXG4gICAgICAgIGxldCB1cmxzID0gW107XG4gICAgICAgIGlmICghU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImxvd0JhbmR3aWR0aFwiKSkge1xuICAgICAgICAgICAgdXJscyA9IHByb3BzLnVybHMgfHwgW107XG5cbiAgICAgICAgICAgIGlmIChwcm9wcy51cmwpIHtcbiAgICAgICAgICAgICAgICB1cmxzLnVuc2hpZnQocHJvcHMudXJsKTsgLy8gcHV0IGluIHVybHNbMF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkZWZhdWx0SW1hZ2VVcmwgPSBudWxsO1xuICAgICAgICBpZiAocHJvcHMuZGVmYXVsdFRvSW5pdGlhbExldHRlcikge1xuICAgICAgICAgICAgZGVmYXVsdEltYWdlVXJsID0gQXZhdGFyTG9naWMuZGVmYXVsdEF2YXRhclVybEZvclN0cmluZyhcbiAgICAgICAgICAgICAgICBwcm9wcy5pZE5hbWUgfHwgcHJvcHMubmFtZSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB1cmxzLnB1c2goZGVmYXVsdEltYWdlVXJsKTsgLy8gbG93ZXN0IHByaW9yaXR5XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkZWR1cGxpY2F0ZSBVUkxzXG4gICAgICAgIHVybHMgPSBBcnJheS5mcm9tKG5ldyBTZXQodXJscykpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbWFnZVVybHM6IHVybHMsXG4gICAgICAgICAgICBkZWZhdWx0SW1hZ2VVcmw6IGRlZmF1bHRJbWFnZVVybCxcbiAgICAgICAgICAgIHVybHNJbmRleDogMCxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgb25FcnJvcjogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgY29uc3QgbmV4dEluZGV4ID0gdGhpcy5zdGF0ZS51cmxzSW5kZXggKyAxO1xuICAgICAgICBpZiAobmV4dEluZGV4IDwgdGhpcy5zdGF0ZS5pbWFnZVVybHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyB0cnkgdGhlIG5leHQgb25lXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICB1cmxzSW5kZXg6IG5leHRJbmRleCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGltYWdlVXJsID0gdGhpcy5zdGF0ZS5pbWFnZVVybHNbdGhpcy5zdGF0ZS51cmxzSW5kZXhdO1xuXG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIG5hbWUsIGlkTmFtZSwgdGl0bGUsIHVybCwgdXJscywgd2lkdGgsIGhlaWdodCwgcmVzaXplTWV0aG9kLFxuICAgICAgICAgICAgZGVmYXVsdFRvSW5pdGlhbExldHRlciwgb25DbGljaywgaW5wdXRSZWYsXG4gICAgICAgICAgICAuLi5vdGhlclByb3BzXG4gICAgICAgIH0gPSB0aGlzLnByb3BzO1xuXG4gICAgICAgIGlmIChpbWFnZVVybCA9PT0gdGhpcy5zdGF0ZS5kZWZhdWx0SW1hZ2VVcmwpIHtcbiAgICAgICAgICAgIGNvbnN0IGluaXRpYWxMZXR0ZXIgPSBBdmF0YXJMb2dpYy5nZXRJbml0aWFsTGV0dGVyKG5hbWUpO1xuICAgICAgICAgICAgY29uc3QgdGV4dE5vZGUgPSAoXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfQmFzZUF2YXRhcl9pbml0aWFsXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiB0b1JlbSh3aWR0aCAqIDAuNjUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHRvUmVtKHdpZHRoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVIZWlnaHQ6IHRvUmVtKGhlaWdodCksXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICB7IGluaXRpYWxMZXR0ZXIgfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjb25zdCBpbWdOb2RlID0gKFxuICAgICAgICAgICAgICAgIDxpbWcgY2xhc3NOYW1lPVwibXhfQmFzZUF2YXRhcl9pbWFnZVwiIHNyYz17aW1hZ2VVcmx9XG4gICAgICAgICAgICAgICAgICAgIGFsdD1cIlwiIHRpdGxlPXt0aXRsZX0gb25FcnJvcj17dGhpcy5vbkVycm9yfVxuICAgICAgICAgICAgICAgICAgICBhcmlhLWhpZGRlbj1cInRydWVcIlxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHRvUmVtKHdpZHRoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogdG9SZW0oaGVpZ2h0KVxuICAgICAgICAgICAgICAgICAgICB9fSAvPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGlmIChvbkNsaWNrICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBlbGVtZW50PSdzcGFuJyBjbGFzc05hbWU9XCJteF9CYXNlQXZhdGFyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e29uQ2xpY2t9IGlucHV0UmVmPXtpbnB1dFJlZn0gey4uLm90aGVyUHJvcHN9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgdGV4dE5vZGUgfVxuICAgICAgICAgICAgICAgICAgICAgICAgeyBpbWdOb2RlIH1cbiAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X0Jhc2VBdmF0YXJcIiByZWY9e2lucHV0UmVmfSB7Li4ub3RoZXJQcm9wc30+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IHRleHROb2RlIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgaW1nTm9kZSB9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvbkNsaWNrICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b25cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfQmFzZUF2YXRhciBteF9CYXNlQXZhdGFyX2ltYWdlXCJcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudD0naW1nJ1xuICAgICAgICAgICAgICAgICAgICBzcmM9e2ltYWdlVXJsfVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtvbkNsaWNrfVxuICAgICAgICAgICAgICAgICAgICBvbkVycm9yPXt0aGlzLm9uRXJyb3J9XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogdG9SZW0od2lkdGgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB0b1JlbShoZWlnaHQpLFxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICB0aXRsZT17dGl0bGV9IGFsdD1cIlwiXG4gICAgICAgICAgICAgICAgICAgIGlucHV0UmVmPXtpbnB1dFJlZn1cbiAgICAgICAgICAgICAgICAgICAgey4uLm90aGVyUHJvcHN9IC8+XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8aW1nXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X0Jhc2VBdmF0YXIgbXhfQmFzZUF2YXRhcl9pbWFnZVwiXG4gICAgICAgICAgICAgICAgICAgIHNyYz17aW1hZ2VVcmx9XG4gICAgICAgICAgICAgICAgICAgIG9uRXJyb3I9e3RoaXMub25FcnJvcn1cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiB0b1JlbSh3aWR0aCksXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHRvUmVtKGhlaWdodCksXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlPXt0aXRsZX0gYWx0PVwiXCJcbiAgICAgICAgICAgICAgICAgICAgcmVmPXtpbnB1dFJlZn1cbiAgICAgICAgICAgICAgICAgICAgey4uLm90aGVyUHJvcHN9IC8+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfSxcbn0pO1xuIl19