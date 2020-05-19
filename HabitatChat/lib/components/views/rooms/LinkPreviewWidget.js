"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _htmlEntities = require("html-entities");

var _HtmlUtils = require("../../../HtmlUtils");

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../index"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var ImageUtils = _interopRequireWildcard(require("../../../ImageUtils"));

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2016 OpenMarket Ltd
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
  displayName: 'LinkPreviewWidget',
  propTypes: {
    link: _propTypes.default.string.isRequired,
    // the URL being previewed
    mxEvent: _propTypes.default.object.isRequired,
    // the Event associated with the preview
    onCancelClick: _propTypes.default.func,
    // called when the preview's cancel ('hide') button is clicked
    onHeightChanged: _propTypes.default.func // called when the preview's contents has loaded

  },
  getInitialState: function () {
    return {
      preview: null
    };
  },
  // TODO: [REACT-WARNING] Replace component with real class, use constructor for refs
  UNSAFE_componentWillMount: function () {
    this.unmounted = false;

    _MatrixClientPeg.MatrixClientPeg.get().getUrlPreview(this.props.link, this.props.mxEvent.getTs()).then(res => {
      if (this.unmounted) {
        return;
      }

      this.setState({
        preview: res
      }, this.props.onHeightChanged);
    }, error => {
      console.error("Failed to get URL preview: " + error);
    });

    this._description = (0, _react.createRef)();
  },
  componentDidMount: function () {
    if (this._description.current) {
      (0, _HtmlUtils.linkifyElement)(this._description.current);
    }
  },
  componentDidUpdate: function () {
    if (this._description.current) {
      (0, _HtmlUtils.linkifyElement)(this._description.current);
    }
  },
  componentWillUnmount: function () {
    this.unmounted = true;
  },
  onImageClick: function (ev) {
    const p = this.state.preview;
    if (ev.button != 0 || ev.metaKey) return;
    ev.preventDefault();
    const ImageView = sdk.getComponent("elements.ImageView");
    let src = p["og:image"];

    if (src && src.startsWith("mxc://")) {
      src = _MatrixClientPeg.MatrixClientPeg.get().mxcUrlToHttp(src);
    }

    const params = {
      src: src,
      width: p["og:image:width"],
      height: p["og:image:height"],
      name: p["og:title"] || p["og:description"] || this.props.link,
      fileSize: p["matrix:image:size"],
      link: this.props.link
    };

    _Modal.default.createDialog(ImageView, params, "mx_Dialog_lightbox");
  },
  render: function () {
    const p = this.state.preview;

    if (!p || Object.keys(p).length === 0) {
      return /*#__PURE__*/_react.default.createElement("div", null);
    } // FIXME: do we want to factor out all image displaying between this and MImageBody - especially for lightboxing?


    let image = p["og:image"];

    if (!_SettingsStore.default.getValue("showImages")) {
      image = null; // Don't render a button to show the image, just hide it outright
    }

    const imageMaxWidth = 100;
    const imageMaxHeight = 100;

    if (image && image.startsWith("mxc://")) {
      image = _MatrixClientPeg.MatrixClientPeg.get().mxcUrlToHttp(image, imageMaxWidth, imageMaxHeight);
    }

    let thumbHeight = imageMaxHeight;

    if (p["og:image:width"] && p["og:image:height"]) {
      thumbHeight = ImageUtils.thumbHeight(p["og:image:width"], p["og:image:height"], imageMaxWidth, imageMaxHeight);
    }

    let img;

    if (image) {
      img = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_LinkPreviewWidget_image",
        style: {
          height: thumbHeight
        }
      }, /*#__PURE__*/_react.default.createElement("img", {
        style: {
          maxWidth: imageMaxWidth,
          maxHeight: imageMaxHeight
        },
        src: image,
        onClick: this.onImageClick
      }));
    } // The description includes &-encoded HTML entities, we decode those as React treats the thing as an
    // opaque string. This does not allow any HTML to be injected into the DOM.


    const description = _htmlEntities.AllHtmlEntities.decode(p["og:description"] || "");

    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_LinkPreviewWidget"
    }, img, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_LinkPreviewWidget_caption"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_LinkPreviewWidget_title"
    }, /*#__PURE__*/_react.default.createElement("a", {
      href: this.props.link,
      target: "_blank",
      rel: "noreferrer noopener"
    }, p["og:title"])), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_LinkPreviewWidget_siteName"
    }, p["og:site_name"] ? " - " + p["og:site_name"] : null), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_LinkPreviewWidget_description",
      ref: this._description
    }, description)), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      className: "mx_LinkPreviewWidget_cancel",
      onClick: this.props.onCancelClick,
      "aria-label": (0, _languageHandler._t)("Close preview")
    }, /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_filterFlipColor",
      alt: "",
      role: "presentation",
      src: require("../../../../res/img/cancel.svg"),
      width: "18",
      height: "18"
    })));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21zL0xpbmtQcmV2aWV3V2lkZ2V0LmpzIl0sIm5hbWVzIjpbImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwibGluayIsIlByb3BUeXBlcyIsInN0cmluZyIsImlzUmVxdWlyZWQiLCJteEV2ZW50Iiwib2JqZWN0Iiwib25DYW5jZWxDbGljayIsImZ1bmMiLCJvbkhlaWdodENoYW5nZWQiLCJnZXRJbml0aWFsU3RhdGUiLCJwcmV2aWV3IiwiVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudCIsInVubW91bnRlZCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImdldFVybFByZXZpZXciLCJwcm9wcyIsImdldFRzIiwidGhlbiIsInJlcyIsInNldFN0YXRlIiwiZXJyb3IiLCJjb25zb2xlIiwiX2Rlc2NyaXB0aW9uIiwiY29tcG9uZW50RGlkTW91bnQiLCJjdXJyZW50IiwiY29tcG9uZW50RGlkVXBkYXRlIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJvbkltYWdlQ2xpY2siLCJldiIsInAiLCJzdGF0ZSIsImJ1dHRvbiIsIm1ldGFLZXkiLCJwcmV2ZW50RGVmYXVsdCIsIkltYWdlVmlldyIsInNkayIsImdldENvbXBvbmVudCIsInNyYyIsInN0YXJ0c1dpdGgiLCJteGNVcmxUb0h0dHAiLCJwYXJhbXMiLCJ3aWR0aCIsImhlaWdodCIsIm5hbWUiLCJmaWxlU2l6ZSIsIk1vZGFsIiwiY3JlYXRlRGlhbG9nIiwicmVuZGVyIiwiT2JqZWN0Iiwia2V5cyIsImxlbmd0aCIsImltYWdlIiwiU2V0dGluZ3NTdG9yZSIsImdldFZhbHVlIiwiaW1hZ2VNYXhXaWR0aCIsImltYWdlTWF4SGVpZ2h0IiwidGh1bWJIZWlnaHQiLCJJbWFnZVV0aWxzIiwiaW1nIiwibWF4V2lkdGgiLCJtYXhIZWlnaHQiLCJkZXNjcmlwdGlvbiIsIkFsbEh0bWxFbnRpdGllcyIsImRlY29kZSIsIkFjY2Vzc2libGVCdXR0b24iLCJy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REosZUFFSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FBaURBLENBQUMsQ0FBQyxjQUFELENBQUQsR0FBcUIsUUFBUUEsQ0FBQyxDQUFDLGNBQUQsQ0FBOUIsR0FBa0QsSUFBbkcsQ0FGSixlQUdJO0FBQUssTUFBQSxTQUFTLEVBQUMsa0NBQWY7QUFBa0QsTUFBQSxHQUFHLEVBQUUsS0FBS1A7QUFBNUQsT0FDTXVDLFdBRE4sQ0FISixDQUZKLGVBU0ksNkJBQUMsZ0JBQUQ7QUFBa0IsTUFBQSxTQUFTLEVBQUMsNkJBQTVCO0FBQTBELE1BQUEsT0FBTyxFQUFFLEtBQUs5QyxLQUFMLENBQVdWLGFBQTlFO0FBQTZGLG9CQUFZLHlCQUFHLGVBQUg7QUFBekcsb0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQyxvQkFBZjtBQUFvQyxNQUFBLEdBQUcsRUFBQyxFQUF4QztBQUEyQyxNQUFBLElBQUksRUFBQyxjQUFoRDtBQUNJLE1BQUEsR0FBRyxFQUFFNEQsT0FBTyxDQUFDLGdDQUFELENBRGhCO0FBQ29ELE1BQUEsS0FBSyxFQUFDLElBRDFEO0FBQytELE1BQUEsTUFBTSxFQUFDO0FBRHRFLE1BREosQ0FUSixDQURKO0FBZ0JIO0FBMUgyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCwge2NyZWF0ZVJlZn0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgeyBBbGxIdG1sRW50aXRpZXMgfSBmcm9tICdodG1sLWVudGl0aWVzJztcbmltcG9ydCB7bGlua2lmeUVsZW1lbnR9IGZyb20gJy4uLy4uLy4uL0h0bWxVdGlscyc7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSBmcm9tIFwiLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vaW5kZXhcIjtcbmltcG9ydCBNb2RhbCBmcm9tIFwiLi4vLi4vLi4vTW9kYWxcIjtcbmltcG9ydCAqIGFzIEltYWdlVXRpbHMgZnJvbSBcIi4uLy4uLy4uL0ltYWdlVXRpbHNcIjtcbmltcG9ydCB7IF90IH0gZnJvbSBcIi4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlclwiO1xuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ0xpbmtQcmV2aWV3V2lkZ2V0JyxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBsaW5rOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsIC8vIHRoZSBVUkwgYmVpbmcgcHJldmlld2VkXG4gICAgICAgIG14RXZlbnQ6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCwgLy8gdGhlIEV2ZW50IGFzc29jaWF0ZWQgd2l0aCB0aGUgcHJldmlld1xuICAgICAgICBvbkNhbmNlbENsaWNrOiBQcm9wVHlwZXMuZnVuYywgLy8gY2FsbGVkIHdoZW4gdGhlIHByZXZpZXcncyBjYW5jZWwgKCdoaWRlJykgYnV0dG9uIGlzIGNsaWNrZWRcbiAgICAgICAgb25IZWlnaHRDaGFuZ2VkOiBQcm9wVHlwZXMuZnVuYywgLy8gY2FsbGVkIHdoZW4gdGhlIHByZXZpZXcncyBjb250ZW50cyBoYXMgbG9hZGVkXG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwcmV2aWV3OiBudWxsLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvLyBUT0RPOiBbUkVBQ1QtV0FSTklOR10gUmVwbGFjZSBjb21wb25lbnQgd2l0aCByZWFsIGNsYXNzLCB1c2UgY29uc3RydWN0b3IgZm9yIHJlZnNcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy51bm1vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFVybFByZXZpZXcodGhpcy5wcm9wcy5saW5rLCB0aGlzLnByb3BzLm14RXZlbnQuZ2V0VHMoKSkudGhlbigocmVzKT0+e1xuICAgICAgICAgICAgaWYgKHRoaXMudW5tb3VudGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZShcbiAgICAgICAgICAgICAgICB7IHByZXZpZXc6IHJlcyB9LFxuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMub25IZWlnaHRDaGFuZ2VkLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSwgKGVycm9yKT0+e1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBnZXQgVVJMIHByZXZpZXc6IFwiICsgZXJyb3IpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9kZXNjcmlwdGlvbiA9IGNyZWF0ZVJlZigpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9kZXNjcmlwdGlvbi5jdXJyZW50KSB7XG4gICAgICAgICAgICBsaW5raWZ5RWxlbWVudCh0aGlzLl9kZXNjcmlwdGlvbi5jdXJyZW50KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fZGVzY3JpcHRpb24uY3VycmVudCkge1xuICAgICAgICAgICAgbGlua2lmeUVsZW1lbnQodGhpcy5fZGVzY3JpcHRpb24uY3VycmVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnVubW91bnRlZCA9IHRydWU7XG4gICAgfSxcblxuICAgIG9uSW1hZ2VDbGljazogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgY29uc3QgcCA9IHRoaXMuc3RhdGUucHJldmlldztcbiAgICAgICAgaWYgKGV2LmJ1dHRvbiAhPSAwIHx8IGV2Lm1ldGFLZXkpIHJldHVybjtcbiAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc3QgSW1hZ2VWaWV3ID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLkltYWdlVmlld1wiKTtcblxuICAgICAgICBsZXQgc3JjID0gcFtcIm9nOmltYWdlXCJdO1xuICAgICAgICBpZiAoc3JjICYmIHNyYy5zdGFydHNXaXRoKFwibXhjOi8vXCIpKSB7XG4gICAgICAgICAgICBzcmMgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkubXhjVXJsVG9IdHRwKHNyYyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJhbXMgPSB7XG4gICAgICAgICAgICBzcmM6IHNyYyxcbiAgICAgICAgICAgIHdpZHRoOiBwW1wib2c6aW1hZ2U6d2lkdGhcIl0sXG4gICAgICAgICAgICBoZWlnaHQ6IHBbXCJvZzppbWFnZTpoZWlnaHRcIl0sXG4gICAgICAgICAgICBuYW1lOiBwW1wib2c6dGl0bGVcIl0gfHwgcFtcIm9nOmRlc2NyaXB0aW9uXCJdIHx8IHRoaXMucHJvcHMubGluayxcbiAgICAgICAgICAgIGZpbGVTaXplOiBwW1wibWF0cml4OmltYWdlOnNpemVcIl0sXG4gICAgICAgICAgICBsaW5rOiB0aGlzLnByb3BzLmxpbmssXG4gICAgICAgIH07XG5cbiAgICAgICAgTW9kYWwuY3JlYXRlRGlhbG9nKEltYWdlVmlldywgcGFyYW1zLCBcIm14X0RpYWxvZ19saWdodGJveFwiKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgcCA9IHRoaXMuc3RhdGUucHJldmlldztcbiAgICAgICAgaWYgKCFwIHx8IE9iamVjdC5rZXlzKHApLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDxkaXYgLz47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGSVhNRTogZG8gd2Ugd2FudCB0byBmYWN0b3Igb3V0IGFsbCBpbWFnZSBkaXNwbGF5aW5nIGJldHdlZW4gdGhpcyBhbmQgTUltYWdlQm9keSAtIGVzcGVjaWFsbHkgZm9yIGxpZ2h0Ym94aW5nP1xuICAgICAgICBsZXQgaW1hZ2UgPSBwW1wib2c6aW1hZ2VcIl07XG4gICAgICAgIGlmICghU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcInNob3dJbWFnZXNcIikpIHtcbiAgICAgICAgICAgIGltYWdlID0gbnVsbDsgLy8gRG9uJ3QgcmVuZGVyIGEgYnV0dG9uIHRvIHNob3cgdGhlIGltYWdlLCBqdXN0IGhpZGUgaXQgb3V0cmlnaHRcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbWFnZU1heFdpZHRoID0gMTAwOyBjb25zdCBpbWFnZU1heEhlaWdodCA9IDEwMDtcbiAgICAgICAgaWYgKGltYWdlICYmIGltYWdlLnN0YXJ0c1dpdGgoXCJteGM6Ly9cIikpIHtcbiAgICAgICAgICAgIGltYWdlID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLm14Y1VybFRvSHR0cChpbWFnZSwgaW1hZ2VNYXhXaWR0aCwgaW1hZ2VNYXhIZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHRodW1iSGVpZ2h0ID0gaW1hZ2VNYXhIZWlnaHQ7XG4gICAgICAgIGlmIChwW1wib2c6aW1hZ2U6d2lkdGhcIl0gJiYgcFtcIm9nOmltYWdlOmhlaWdodFwiXSkge1xuICAgICAgICAgICAgdGh1bWJIZWlnaHQgPSBJbWFnZVV0aWxzLnRodW1iSGVpZ2h0KHBbXCJvZzppbWFnZTp3aWR0aFwiXSwgcFtcIm9nOmltYWdlOmhlaWdodFwiXSwgaW1hZ2VNYXhXaWR0aCwgaW1hZ2VNYXhIZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGltZztcbiAgICAgICAgaWYgKGltYWdlKSB7XG4gICAgICAgICAgICBpbWcgPSA8ZGl2IGNsYXNzTmFtZT1cIm14X0xpbmtQcmV2aWV3V2lkZ2V0X2ltYWdlXCIgc3R5bGU9e3sgaGVpZ2h0OiB0aHVtYkhlaWdodCB9fT5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBzdHlsZT17eyBtYXhXaWR0aDogaW1hZ2VNYXhXaWR0aCwgbWF4SGVpZ2h0OiBpbWFnZU1heEhlaWdodCB9fSBzcmM9e2ltYWdlfSBvbkNsaWNrPXt0aGlzLm9uSW1hZ2VDbGlja30gLz5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBkZXNjcmlwdGlvbiBpbmNsdWRlcyAmLWVuY29kZWQgSFRNTCBlbnRpdGllcywgd2UgZGVjb2RlIHRob3NlIGFzIFJlYWN0IHRyZWF0cyB0aGUgdGhpbmcgYXMgYW5cbiAgICAgICAgLy8gb3BhcXVlIHN0cmluZy4gVGhpcyBkb2VzIG5vdCBhbGxvdyBhbnkgSFRNTCB0byBiZSBpbmplY3RlZCBpbnRvIHRoZSBET00uXG4gICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gQWxsSHRtbEVudGl0aWVzLmRlY29kZShwW1wib2c6ZGVzY3JpcHRpb25cIl0gfHwgXCJcIik7XG5cbiAgICAgICAgY29uc3QgQWNjZXNzaWJsZUJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkFjY2Vzc2libGVCdXR0b24nKTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTGlua1ByZXZpZXdXaWRnZXRcIiA+XG4gICAgICAgICAgICAgICAgeyBpbWcgfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTGlua1ByZXZpZXdXaWRnZXRfY2FwdGlvblwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0xpbmtQcmV2aWV3V2lkZ2V0X3RpdGxlXCI+PGEgaHJlZj17dGhpcy5wcm9wcy5saW5rfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub3JlZmVycmVyIG5vb3BlbmVyXCI+eyBwW1wib2c6dGl0bGVcIl0gfTwvYT48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9MaW5rUHJldmlld1dpZGdldF9zaXRlTmFtZVwiPnsgcFtcIm9nOnNpdGVfbmFtZVwiXSA/IChcIiAtIFwiICsgcFtcIm9nOnNpdGVfbmFtZVwiXSkgOiBudWxsIH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9MaW5rUHJldmlld1dpZGdldF9kZXNjcmlwdGlvblwiIHJlZj17dGhpcy5fZGVzY3JpcHRpb259PlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBkZXNjcmlwdGlvbiB9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X0xpbmtQcmV2aWV3V2lkZ2V0X2NhbmNlbFwiIG9uQ2xpY2s9e3RoaXMucHJvcHMub25DYW5jZWxDbGlja30gYXJpYS1sYWJlbD17X3QoXCJDbG9zZSBwcmV2aWV3XCIpfT5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBjbGFzc05hbWU9XCJteF9maWx0ZXJGbGlwQ29sb3JcIiBhbHQ9XCJcIiByb2xlPVwicHJlc2VudGF0aW9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvY2FuY2VsLnN2Z1wiKX0gd2lkdGg9XCIxOFwiIGhlaWdodD1cIjE4XCIgLz5cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxufSk7XG4iXX0=