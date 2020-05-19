"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HiddenImagePlaceholder = exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _MFileBody = _interopRequireDefault(require("./MFileBody"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _DecryptFile = require("../../../utils/DecryptFile");

var _languageHandler = require("../../../languageHandler");

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _MatrixClientContext = _interopRequireDefault(require("../../../contexts/MatrixClientContext"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2018 New Vector Ltd
Copyright 2018, 2019 Michael Telatynski <7t3chguy@gmail.com>

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
class MImageBody extends _react.default.Component {
  constructor(props) {
    super(props);
    this.onImageError = this.onImageError.bind(this);
    this.onImageLoad = this.onImageLoad.bind(this);
    this.onImageEnter = this.onImageEnter.bind(this);
    this.onImageLeave = this.onImageLeave.bind(this);
    this.onClientSync = this.onClientSync.bind(this);
    this.onClick = this.onClick.bind(this);
    this._isGif = this._isGif.bind(this);
    this.state = {
      decryptedUrl: null,
      decryptedThumbnailUrl: null,
      decryptedBlob: null,
      error: null,
      imgError: false,
      imgLoaded: false,
      loadedImageDimensions: null,
      hover: false,
      showImage: _SettingsStore.default.getValue("showImages")
    };
    this._image = (0, _react.createRef)();
  } // FIXME: factor this out and aplpy it to MVideoBody and MAudioBody too!


  onClientSync(syncState, prevState) {
    if (this.unmounted) return; // Consider the client reconnected if there is no error with syncing.
    // This means the state could be RECONNECTING, SYNCING, PREPARED or CATCHUP.

    const reconnected = syncState !== "ERROR" && prevState !== syncState;

    if (reconnected && this.state.imgError) {
      // Load the image again
      this.setState({
        imgError: false
      });
    }
  }

  showImage() {
    localStorage.setItem("mx_ShowImage_" + this.props.mxEvent.getId(), "true");
    this.setState({
      showImage: true
    });
  }

  onClick(ev) {
    if (ev.button === 0 && !ev.metaKey) {
      ev.preventDefault();

      if (!this.state.showImage) {
        this.showImage();
        return;
      }

      const content = this.props.mxEvent.getContent();

      const httpUrl = this._getContentUrl();

      const ImageView = sdk.getComponent("elements.ImageView");
      const params = {
        src: httpUrl,
        name: content.body && content.body.length > 0 ? content.body : (0, _languageHandler._t)('Attachment'),
        mxEvent: this.props.mxEvent
      };

      if (content.info) {
        params.width = content.info.w;
        params.height = content.info.h;
        params.fileSize = content.info.size;
      }

      _Modal.default.createDialog(ImageView, params, "mx_Dialog_lightbox");
    }
  }

  _isGif() {
    const content = this.props.mxEvent.getContent();
    return content && content.info && content.info.mimetype === "image/gif";
  }

  onImageEnter(e) {
    this.setState({
      hover: true
    });

    if (!this.state.showImage || !this._isGif() || _SettingsStore.default.getValue("autoplayGifsAndVideos")) {
      return;
    }

    const imgElement = e.target;
    imgElement.src = this._getContentUrl();
  }

  onImageLeave(e) {
    this.setState({
      hover: false
    });

    if (!this.state.showImage || !this._isGif() || _SettingsStore.default.getValue("autoplayGifsAndVideos")) {
      return;
    }

    const imgElement = e.target;
    imgElement.src = this._getThumbUrl();
  }

  onImageError() {
    this.setState({
      imgError: true
    });
  }

  onImageLoad() {
    this.props.onHeightChanged();
    let loadedImageDimensions;

    if (this._image.current) {
      const {
        naturalWidth,
        naturalHeight
      } = this._image.current; // this is only used as a fallback in case content.info.w/h is missing

      loadedImageDimensions = {
        naturalWidth,
        naturalHeight
      };
    }

    this.setState({
      imgLoaded: true,
      loadedImageDimensions
    });
  }

  _getContentUrl() {
    const content = this.props.mxEvent.getContent();

    if (content.file !== undefined) {
      return this.state.decryptedUrl;
    } else {
      return this.context.mxcUrlToHttp(content.url);
    }
  }

  _getThumbUrl() {
    // FIXME: the dharma skin lets images grow as wide as you like, rather than capped to 800x600.
    // So either we need to support custom timeline widths here, or reimpose the cap, otherwise the
    // thumbnail resolution will be unnecessarily reduced.
    // custom timeline widths seems preferable.
    const pixelRatio = window.devicePixelRatio;
    const thumbWidth = Math.round(800 * pixelRatio);
    const thumbHeight = Math.round(600 * pixelRatio);
    const content = this.props.mxEvent.getContent();

    if (content.file !== undefined) {
      // Don't use the thumbnail for clients wishing to autoplay gifs.
      if (this.state.decryptedThumbnailUrl) {
        return this.state.decryptedThumbnailUrl;
      }

      return this.state.decryptedUrl;
    } else if (content.info && content.info.mimetype === "image/svg+xml" && content.info.thumbnail_url) {
      // special case to return clientside sender-generated thumbnails for SVGs, if any,
      // given we deliberately don't thumbnail them serverside to prevent
      // billion lol attacks and similar
      return this.context.mxcUrlToHttp(content.info.thumbnail_url, thumbWidth, thumbHeight);
    } else {
      // we try to download the correct resolution
      // for hi-res images (like retina screenshots).
      // synapse only supports 800x600 thumbnails for now though,
      // so we'll need to download the original image for this to work
      // well for now. First, let's try a few cases that let us avoid
      // downloading the original, including:
      //   - When displaying a GIF, we always want to thumbnail so that we can
      //     properly respect the user's GIF autoplay setting (which relies on
      //     thumbnailing to produce the static preview image)
      //   - On a low DPI device, always thumbnail to save bandwidth
      //   - If there's no sizing info in the event, default to thumbnail
      const info = content.info;

      if (this._isGif() || pixelRatio === 1.0 || !info || !info.w || !info.h || !info.size) {
        return this.context.mxcUrlToHttp(content.url, thumbWidth, thumbHeight);
      } else {
        // we should only request thumbnails if the image is bigger than 800x600
        // (or 1600x1200 on retina) otherwise the image in the timeline will just
        // end up resampled and de-retina'd for no good reason.
        // Ideally the server would pregen 1600x1200 thumbnails in order to provide retina
        // thumbnails, but we don't do this currently in synapse for fear of disk space.
        // As a compromise, let's switch to non-retina thumbnails only if the original
        // image is both physically too large and going to be massive to load in the
        // timeline (e.g. >1MB).
        const isLargerThanThumbnail = info.w > thumbWidth || info.h > thumbHeight;
        const isLargeFileSize = info.size > 1 * 1024 * 1024;

        if (isLargeFileSize && isLargerThanThumbnail) {
          // image is too large physically and bytewise to clutter our timeline so
          // we ask for a thumbnail, despite knowing that it will be max 800x600
          // despite us being retina (as synapse doesn't do 1600x1200 thumbs yet).
          return this.context.mxcUrlToHttp(content.url, thumbWidth, thumbHeight);
        } else {
          // download the original image otherwise, so we can scale it client side
          // to take pixelRatio into account.
          // ( no width/height means we want the original image)
          return this.context.mxcUrlToHttp(content.url);
        }
      }
    }
  }

  componentDidMount() {
    this.unmounted = false;
    this.context.on('sync', this.onClientSync);
    const content = this.props.mxEvent.getContent();

    if (content.file !== undefined && this.state.decryptedUrl === null) {
      let thumbnailPromise = Promise.resolve(null);

      if (content.info && content.info.thumbnail_file) {
        thumbnailPromise = (0, _DecryptFile.decryptFile)(content.info.thumbnail_file).then(function (blob) {
          return URL.createObjectURL(blob);
        });
      }

      let decryptedBlob;
      thumbnailPromise.then(thumbnailUrl => {
        return (0, _DecryptFile.decryptFile)(content.file).then(function (blob) {
          decryptedBlob = blob;
          return URL.createObjectURL(blob);
        }).then(contentUrl => {
          if (this.unmounted) return;
          this.setState({
            decryptedUrl: contentUrl,
            decryptedThumbnailUrl: thumbnailUrl,
            decryptedBlob: decryptedBlob
          });
        });
      }).catch(err => {
        if (this.unmounted) return;
        console.warn("Unable to decrypt attachment: ", err); // Set a placeholder image when we can't decrypt the image.

        this.setState({
          error: err
        });
      });
    } // Remember that the user wanted to show this particular image


    if (!this.state.showImage && localStorage.getItem("mx_ShowImage_" + this.props.mxEvent.getId()) === "true") {
      this.setState({
        showImage: true
      });
    }

    this._afterComponentDidMount();
  } // To be overridden by subclasses (e.g. MStickerBody) for further
  // initialisation after componentDidMount


  _afterComponentDidMount() {}

  componentWillUnmount() {
    this.unmounted = true;
    this.context.removeListener('sync', this.onClientSync);

    this._afterComponentWillUnmount();

    if (this.state.decryptedUrl) {
      URL.revokeObjectURL(this.state.decryptedUrl);
    }

    if (this.state.decryptedThumbnailUrl) {
      URL.revokeObjectURL(this.state.decryptedThumbnailUrl);
    }
  } // To be overridden by subclasses (e.g. MStickerBody) for further
  // cleanup after componentWillUnmount


  _afterComponentWillUnmount() {}

  _messageContent(contentUrl, thumbUrl, content) {
    let infoWidth;
    let infoHeight;

    if (content && content.info && content.info.w && content.info.h) {
      infoWidth = content.info.w;
      infoHeight = content.info.h;
    } else {
      // Whilst the image loads, display nothing.
      //
      // Once loaded, use the loaded image dimensions stored in `loadedImageDimensions`.
      //
      // By doing this, the image "pops" into the timeline, but is still restricted
      // by the same width and height logic below.
      if (!this.state.loadedImageDimensions) {
        let imageElement;

        if (!this.state.showImage) {
          imageElement = /*#__PURE__*/_react.default.createElement(HiddenImagePlaceholder, null);
        } else {
          imageElement = /*#__PURE__*/_react.default.createElement("img", {
            style: {
              display: 'none'
            },
            src: thumbUrl,
            ref: this._image,
            alt: content.body,
            onError: this.onImageError,
            onLoad: this.onImageLoad
          });
        }

        return this.wrapImage(contentUrl, imageElement);
      }

      infoWidth = this.state.loadedImageDimensions.naturalWidth;
      infoHeight = this.state.loadedImageDimensions.naturalHeight;
    } // The maximum height of the thumbnail as it is rendered as an <img>


    const maxHeight = Math.min(this.props.maxImageHeight || 600, infoHeight); // The maximum width of the thumbnail, as dictated by its natural
    // maximum height.

    const maxWidth = infoWidth * maxHeight / infoHeight;
    let img = null;
    let placeholder = null;
    let gifLabel = null; // e2e image hasn't been decrypted yet

    if (content.file !== undefined && this.state.decryptedUrl === null) {
      placeholder = /*#__PURE__*/_react.default.createElement("img", {
        src: require("../../../../res/img/spinner.gif"),
        alt: content.body,
        width: "32",
        height: "32"
      });
    } else if (!this.state.imgLoaded) {
      // Deliberately, getSpinner is left unimplemented here, MStickerBody overides
      placeholder = this.getPlaceholder();
    }

    let showPlaceholder = Boolean(placeholder);

    if (thumbUrl && !this.state.imgError) {
      // Restrict the width of the thumbnail here, otherwise it will fill the container
      // which has the same width as the timeline
      // mx_MImageBody_thumbnail resizes img to exactly container size
      img = /*#__PURE__*/_react.default.createElement("img", {
        className: "mx_MImageBody_thumbnail",
        src: thumbUrl,
        ref: this._image,
        style: {
          maxWidth: maxWidth + "px"
        },
        alt: content.body,
        onError: this.onImageError,
        onLoad: this.onImageLoad,
        onMouseEnter: this.onImageEnter,
        onMouseLeave: this.onImageLeave
      });
    }

    if (!this.state.showImage) {
      img = /*#__PURE__*/_react.default.createElement(HiddenImagePlaceholder, {
        style: {
          maxWidth: maxWidth + "px"
        }
      });
      showPlaceholder = false; // because we're hiding the image, so don't show the sticker icon.
    }

    if (this._isGif() && !_SettingsStore.default.getValue("autoplayGifsAndVideos") && !this.state.hover) {
      gifLabel = /*#__PURE__*/_react.default.createElement("p", {
        className: "mx_MImageBody_gifLabel"
      }, "GIF");
    }

    const thumbnail = /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MImageBody_thumbnail_container",
      style: {
        maxHeight: maxHeight + "px"
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: {
        paddingBottom: 100 * infoHeight / infoWidth + '%'
      }
    }), showPlaceholder && /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MImageBody_thumbnail",
      style: {
        // Constrain width here so that spinner appears central to the loaded thumbnail
        maxWidth: infoWidth + "px"
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MImageBody_thumbnail_spinner"
    }, placeholder)), /*#__PURE__*/_react.default.createElement("div", {
      style: {
        display: !showPlaceholder ? undefined : 'none'
      }
    }, img, gifLabel), this.state.hover && this.getTooltip());

    return this.wrapImage(contentUrl, thumbnail);
  } // Overidden by MStickerBody


  wrapImage(contentUrl, children) {
    return /*#__PURE__*/_react.default.createElement("a", {
      href: contentUrl,
      onClick: this.onClick
    }, children);
  } // Overidden by MStickerBody


  getPlaceholder() {
    // MImageBody doesn't show a placeholder whilst the image loads, (but it could do)
    return null;
  } // Overidden by MStickerBody


  getTooltip() {
    return null;
  } // Overidden by MStickerBody


  getFileBody() {
    return /*#__PURE__*/_react.default.createElement(_MFileBody.default, (0, _extends2.default)({}, this.props, {
      decryptedBlob: this.state.decryptedBlob
    }));
  }

  render() {
    const content = this.props.mxEvent.getContent();

    if (this.state.error !== null) {
      return /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_MImageBody"
      }, /*#__PURE__*/_react.default.createElement("img", {
        src: require("../../../../res/img/warning.svg"),
        width: "16",
        height: "16"
      }), (0, _languageHandler._t)("Error decrypting image"));
    }

    const contentUrl = this._getContentUrl();

    let thumbUrl;

    if (this._isGif() && _SettingsStore.default.getValue("autoplayGifsAndVideos")) {
      thumbUrl = contentUrl;
    } else {
      thumbUrl = this._getThumbUrl();
    }

    const thumbnail = this._messageContent(contentUrl, thumbUrl, content);

    const fileBody = this.getFileBody();
    return /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_MImageBody"
    }, thumbnail, fileBody);
  }

}

exports.default = MImageBody;
(0, _defineProperty2.default)(MImageBody, "propTypes", {
  /* the MatrixEvent to show */
  mxEvent: _propTypes.default.object.isRequired,

  /* called when the image has loaded */
  onHeightChanged: _propTypes.default.func.isRequired,

  /* the maximum image height to use */
  maxImageHeight: _propTypes.default.number
});
(0, _defineProperty2.default)(MImageBody, "contextType", _MatrixClientContext.default);

class HiddenImagePlaceholder extends _react.default.PureComponent {
  render() {
    let className = 'mx_HiddenImagePlaceholder';
    if (this.props.hover) className += ' mx_HiddenImagePlaceholder_hover';
    return /*#__PURE__*/_react.default.createElement("div", {
      className: className
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_HiddenImagePlaceholder_button"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_HiddenImagePlaceholder_eye"
    }), /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)("Show image"))));
  }

}

exports.HiddenImagePlaceholder = HiddenImagePlaceholder;
(0, _defineProperty2.default)(HiddenImagePlaceholder, "propTypes", {
  hover: _propTypes.default.bool
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL21lc3NhZ2VzL01JbWFnZUJvZHkuanMiXSwibmFtZXMiOlsiTUltYWdlQm9keSIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsIm9uSW1hZ2VFcnJvciIsImJpbmQiLCJvbkltYWdlTG9hZCIsIm9uSW1hZ2VFbnRlciIsIm9uSW1hZ2VMZWF2ZSIsIm9uQ2xpZW50U3luYyIsIm9uQ2xpY2siLCJfaXNHaWYiLCJzdGF0ZSIsImRlY3J5cHRlZFVybCIsImRlY3J5cHRlZFRodW1ibmFpbFVybCIsImRlY3J5cHRlZEJsb2IiLCJlcnJvciIsImltZ0Vycm9yIiwiaW1nTG9hZGVkIiwibG9hZGVkSW1hZ2VEaW1lbnNpb25zIiwiaG92ZXIiLCJzaG93SW1hZ2UiLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWUiLCJfaW1hZ2UiLCJzeW5jU3RhdGUiLCJwcmV2U3RhdGUiLCJ1bm1vdW50ZWQiLCJyZWNvbm5lY3RlZCIsInNldFN0YXRlIiwibG9jYWxTdG9yYWdlIiwic2V0SXRlbSIsIm14RXZlbnQiLCJnZXRJZCIsImV2IiwiYnV0dG9uIiwibWV0YUtleSIsInByZXZlbnREZWZhdWx0IiwiY29udGVudCIsImdldENvbnRlbnQiLCJodHRwVXJsIiwiX2dldENvbnRlbnRVcmwiLCJJbWFnZVZpZXciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJwYXJhbXMiLCJzcmMiLCJuYW1lIiwiYm9keSIsImxlbmd0aCIsImluZm8iLCJ3aWR0aCIsInciLCJoZWlnaHQiLCJoIiwiZmlsZVNpemUiLCJzaXplIiwiTW9kYWwiLCJjcmVhdGVEaWFsb2ciLCJtaW1ldHlwZSIsImUiLCJpbWdFbGVtZW50IiwidGFyZ2V0IiwiX2dldFRodW1iVXJsIiwib25IZWlnaHRDaGFuZ2VkIiwiY3VycmVudCIsIm5hdHVyYWxXaWR0aCIsIm5hdHVyYWxIZWlnaHQiLCJmaWxlIiwidW5kZWZpbmVkIiwiY29udGV4dCIsIm14Y1VybFRvSHR0cCIsInVybCIsInBpeGVsUmF0aW8iLCJ3aW5kb3ciLCJkZXZpY2VQaXhlbFJhdGlvIiwidGh1bWJXaWR0aCIsIk1hdGgiLCJyb3VuZCIsInRodW1iSGVpZ2h0IiwidGh1bWJuYWlsX3VybCIsImlzTGFyZ2VyVGhhblRodW1ibmFpbCIsImlzTGFyZ2VGaWxlU2l6ZSIsImNvbXBvbmVudERpZE1vdW50Iiwib24iLCJ0aHVtYm5haWxQcm9taXNlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0aHVtYm5haWxfZmlsZSIsInRoZW4iLCJibG9iIiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIiwidGh1bWJuYWlsVXJsIiwiY29udGVudFVybCIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsIndhcm4iLCJnZXRJdGVtIiwiX2FmdGVyQ29tcG9uZW50RGlkTW91bnQiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInJlbW92ZUxpc3RlbmVyIiwiX2FmdGVyQ29tcG9uZW50V2lsbFVubW91bnQiLCJyZXZva2VPYmplY3RVUkwiLCJfbWVzc2FnZUNvbnRlbnQiLCJ0aHVtYlVybCIsImluZm9XaWR0aCIsImluZm9IZWlnaHQiLCJpbWFnZUVsZW1lbnQiLCJkaXNwbGF5Iiwid3JhcEltYWdlIiwibWF4SGVpZ2h0IiwibWluIiwibWF4SW1hZ2VIZWlnaHQiLCJtYXhXaWR0aCIsImltZyIsInBsYWNlaG9sZGVyIiwiZ2lmTGFiZWwiLCJyZXF1aXJlIiwiZ2V0UGxhY2Vob2xkZXIiLCJzaG93UGxhY2Vob2xkZXIiLCJCb29sZWFuIiwidGh1bWJuYWlsIiwicGFkZGluZ0JvdHRvbSIsImdldFRvb2x0aXAiLCJjaGlsZHJlbiIsImdldEZpbGVCb2R5IiwicmVuZGVyIiwiZmlsZUJvZHkiLCJQcm9wVHlwZXMiLCJvYmplY3QiLCJpc1JlcXVpcmVkIiwiZnVuYyIsIm51bWJlciIsIk1hdHJpeENsaWVudENvbnRleHQiLCJIaWRkZW5JbWFnZVBsYWNlaG9sZGVyIiwiUHVyZUNvbXBvbmVudCIsImNsYXNzTmFtZSIsImJv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QixLQUFmLEVBQXNCc0gsU0FBUyxJQUFJLGtDQUFiO0FBQ3RCLHdCQUNJO0FBQUssTUFBQSxTQUFTLEVBQUVBO0FBQWhCLG9CQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSTtBQUFNLE1BQUEsU0FBUyxFQUFDO0FBQWhCLE1BREosZUFFSSwyQ0FBTyx5QkFBRyxZQUFILENBQVAsQ0FGSixDQURKLENBREo7QUFRSDs7QUFoQjJEOzs7OEJBQW5ERixzQixlQUNVO0FBQ2ZwSCxFQUFBQSxLQUFLLEVBQUU4RyxtQkFBVVM7QUFERixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTgsIDIwMTkgTWljaGFlbCBUZWxhdHluc2tpIDw3dDNjaGd1eUBnbWFpbC5jb20+XG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0LCB7Y3JlYXRlUmVmfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuXG5pbXBvcnQgTUZpbGVCb2R5IGZyb20gJy4vTUZpbGVCb2R5JztcbmltcG9ydCBNb2RhbCBmcm9tICcuLi8uLi8uLi9Nb2RhbCc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHsgZGVjcnlwdEZpbGUgfSBmcm9tICcuLi8uLi8uLi91dGlscy9EZWNyeXB0RmlsZSc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSBmcm9tIFwiLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xuaW1wb3J0IE1hdHJpeENsaWVudENvbnRleHQgZnJvbSBcIi4uLy4uLy4uL2NvbnRleHRzL01hdHJpeENsaWVudENvbnRleHRcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTUltYWdlQm9keSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgLyogdGhlIE1hdHJpeEV2ZW50IHRvIHNob3cgKi9cbiAgICAgICAgbXhFdmVudDogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuXG4gICAgICAgIC8qIGNhbGxlZCB3aGVuIHRoZSBpbWFnZSBoYXMgbG9hZGVkICovXG4gICAgICAgIG9uSGVpZ2h0Q2hhbmdlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcblxuICAgICAgICAvKiB0aGUgbWF4aW11bSBpbWFnZSBoZWlnaHQgdG8gdXNlICovXG4gICAgICAgIG1heEltYWdlSGVpZ2h0OiBQcm9wVHlwZXMubnVtYmVyLFxuICAgIH07XG5cbiAgICBzdGF0aWMgY29udGV4dFR5cGUgPSBNYXRyaXhDbGllbnRDb250ZXh0O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMub25JbWFnZUVycm9yID0gdGhpcy5vbkltYWdlRXJyb3IuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vbkltYWdlTG9hZCA9IHRoaXMub25JbWFnZUxvYWQuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vbkltYWdlRW50ZXIgPSB0aGlzLm9uSW1hZ2VFbnRlci5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9uSW1hZ2VMZWF2ZSA9IHRoaXMub25JbWFnZUxlYXZlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub25DbGllbnRTeW5jID0gdGhpcy5vbkNsaWVudFN5bmMuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vbkNsaWNrID0gdGhpcy5vbkNsaWNrLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX2lzR2lmID0gdGhpcy5faXNHaWYuYmluZCh0aGlzKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgZGVjcnlwdGVkVXJsOiBudWxsLFxuICAgICAgICAgICAgZGVjcnlwdGVkVGh1bWJuYWlsVXJsOiBudWxsLFxuICAgICAgICAgICAgZGVjcnlwdGVkQmxvYjogbnVsbCxcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgaW1nRXJyb3I6IGZhbHNlLFxuICAgICAgICAgICAgaW1nTG9hZGVkOiBmYWxzZSxcbiAgICAgICAgICAgIGxvYWRlZEltYWdlRGltZW5zaW9uczogbnVsbCxcbiAgICAgICAgICAgIGhvdmVyOiBmYWxzZSxcbiAgICAgICAgICAgIHNob3dJbWFnZTogU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcInNob3dJbWFnZXNcIiksXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5faW1hZ2UgPSBjcmVhdGVSZWYoKTtcbiAgICB9XG5cbiAgICAvLyBGSVhNRTogZmFjdG9yIHRoaXMgb3V0IGFuZCBhcGxweSBpdCB0byBNVmlkZW9Cb2R5IGFuZCBNQXVkaW9Cb2R5IHRvbyFcbiAgICBvbkNsaWVudFN5bmMoc3luY1N0YXRlLCBwcmV2U3RhdGUpIHtcbiAgICAgICAgaWYgKHRoaXMudW5tb3VudGVkKSByZXR1cm47XG4gICAgICAgIC8vIENvbnNpZGVyIHRoZSBjbGllbnQgcmVjb25uZWN0ZWQgaWYgdGhlcmUgaXMgbm8gZXJyb3Igd2l0aCBzeW5jaW5nLlxuICAgICAgICAvLyBUaGlzIG1lYW5zIHRoZSBzdGF0ZSBjb3VsZCBiZSBSRUNPTk5FQ1RJTkcsIFNZTkNJTkcsIFBSRVBBUkVEIG9yIENBVENIVVAuXG4gICAgICAgIGNvbnN0IHJlY29ubmVjdGVkID0gc3luY1N0YXRlICE9PSBcIkVSUk9SXCIgJiYgcHJldlN0YXRlICE9PSBzeW5jU3RhdGU7XG4gICAgICAgIGlmIChyZWNvbm5lY3RlZCAmJiB0aGlzLnN0YXRlLmltZ0Vycm9yKSB7XG4gICAgICAgICAgICAvLyBMb2FkIHRoZSBpbWFnZSBhZ2FpblxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgaW1nRXJyb3I6IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzaG93SW1hZ2UoKSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibXhfU2hvd0ltYWdlX1wiICsgdGhpcy5wcm9wcy5teEV2ZW50LmdldElkKCksIFwidHJ1ZVwiKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2hvd0ltYWdlOiB0cnVlfSk7XG4gICAgfVxuXG4gICAgb25DbGljayhldikge1xuICAgICAgICBpZiAoZXYuYnV0dG9uID09PSAwICYmICFldi5tZXRhS2V5KSB7XG4gICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnN0YXRlLnNob3dJbWFnZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0ltYWdlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gdGhpcy5wcm9wcy5teEV2ZW50LmdldENvbnRlbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IGh0dHBVcmwgPSB0aGlzLl9nZXRDb250ZW50VXJsKCk7XG4gICAgICAgICAgICBjb25zdCBJbWFnZVZpZXcgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuSW1hZ2VWaWV3XCIpO1xuICAgICAgICAgICAgY29uc3QgcGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIHNyYzogaHR0cFVybCxcbiAgICAgICAgICAgICAgICBuYW1lOiBjb250ZW50LmJvZHkgJiYgY29udGVudC5ib2R5Lmxlbmd0aCA+IDAgPyBjb250ZW50LmJvZHkgOiBfdCgnQXR0YWNobWVudCcpLFxuICAgICAgICAgICAgICAgIG14RXZlbnQ6IHRoaXMucHJvcHMubXhFdmVudCxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChjb250ZW50LmluZm8pIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMud2lkdGggPSBjb250ZW50LmluZm8udztcbiAgICAgICAgICAgICAgICBwYXJhbXMuaGVpZ2h0ID0gY29udGVudC5pbmZvLmg7XG4gICAgICAgICAgICAgICAgcGFyYW1zLmZpbGVTaXplID0gY29udGVudC5pbmZvLnNpemU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZURpYWxvZyhJbWFnZVZpZXcsIHBhcmFtcywgXCJteF9EaWFsb2dfbGlnaHRib3hcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfaXNHaWYoKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLnByb3BzLm14RXZlbnQuZ2V0Q29udGVudCgpO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIGNvbnRlbnQgJiZcbiAgICAgICAgICBjb250ZW50LmluZm8gJiZcbiAgICAgICAgICBjb250ZW50LmluZm8ubWltZXR5cGUgPT09IFwiaW1hZ2UvZ2lmXCJcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBvbkltYWdlRW50ZXIoZSkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHsgaG92ZXI6IHRydWUgfSk7XG5cbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLnNob3dJbWFnZSB8fCAhdGhpcy5faXNHaWYoKSB8fCBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiYXV0b3BsYXlHaWZzQW5kVmlkZW9zXCIpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW1nRWxlbWVudCA9IGUudGFyZ2V0O1xuICAgICAgICBpbWdFbGVtZW50LnNyYyA9IHRoaXMuX2dldENvbnRlbnRVcmwoKTtcbiAgICB9XG5cbiAgICBvbkltYWdlTGVhdmUoZSkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHsgaG92ZXI6IGZhbHNlIH0pO1xuXG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5zaG93SW1hZ2UgfHwgIXRoaXMuX2lzR2lmKCkgfHwgU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImF1dG9wbGF5R2lmc0FuZFZpZGVvc1wiKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGltZ0VsZW1lbnQgPSBlLnRhcmdldDtcbiAgICAgICAgaW1nRWxlbWVudC5zcmMgPSB0aGlzLl9nZXRUaHVtYlVybCgpO1xuICAgIH1cblxuICAgIG9uSW1hZ2VFcnJvcigpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBpbWdFcnJvcjogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgb25JbWFnZUxvYWQoKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25IZWlnaHRDaGFuZ2VkKCk7XG5cbiAgICAgICAgbGV0IGxvYWRlZEltYWdlRGltZW5zaW9ucztcblxuICAgICAgICBpZiAodGhpcy5faW1hZ2UuY3VycmVudCkge1xuICAgICAgICAgICAgY29uc3QgeyBuYXR1cmFsV2lkdGgsIG5hdHVyYWxIZWlnaHQgfSA9IHRoaXMuX2ltYWdlLmN1cnJlbnQ7XG4gICAgICAgICAgICAvLyB0aGlzIGlzIG9ubHkgdXNlZCBhcyBhIGZhbGxiYWNrIGluIGNhc2UgY29udGVudC5pbmZvLncvaCBpcyBtaXNzaW5nXG4gICAgICAgICAgICBsb2FkZWRJbWFnZURpbWVuc2lvbnMgPSB7IG5hdHVyYWxXaWR0aCwgbmF0dXJhbEhlaWdodCB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGltZ0xvYWRlZDogdHJ1ZSwgbG9hZGVkSW1hZ2VEaW1lbnNpb25zIH0pO1xuICAgIH1cblxuICAgIF9nZXRDb250ZW50VXJsKCkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gdGhpcy5wcm9wcy5teEV2ZW50LmdldENvbnRlbnQoKTtcbiAgICAgICAgaWYgKGNvbnRlbnQuZmlsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5kZWNyeXB0ZWRVcmw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb250ZXh0Lm14Y1VybFRvSHR0cChjb250ZW50LnVybCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZ2V0VGh1bWJVcmwoKSB7XG4gICAgICAgIC8vIEZJWE1FOiB0aGUgZGhhcm1hIHNraW4gbGV0cyBpbWFnZXMgZ3JvdyBhcyB3aWRlIGFzIHlvdSBsaWtlLCByYXRoZXIgdGhhbiBjYXBwZWQgdG8gODAweDYwMC5cbiAgICAgICAgLy8gU28gZWl0aGVyIHdlIG5lZWQgdG8gc3VwcG9ydCBjdXN0b20gdGltZWxpbmUgd2lkdGhzIGhlcmUsIG9yIHJlaW1wb3NlIHRoZSBjYXAsIG90aGVyd2lzZSB0aGVcbiAgICAgICAgLy8gdGh1bWJuYWlsIHJlc29sdXRpb24gd2lsbCBiZSB1bm5lY2Vzc2FyaWx5IHJlZHVjZWQuXG4gICAgICAgIC8vIGN1c3RvbSB0aW1lbGluZSB3aWR0aHMgc2VlbXMgcHJlZmVyYWJsZS5cbiAgICAgICAgY29uc3QgcGl4ZWxSYXRpbyA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xuICAgICAgICBjb25zdCB0aHVtYldpZHRoID0gTWF0aC5yb3VuZCg4MDAgKiBwaXhlbFJhdGlvKTtcbiAgICAgICAgY29uc3QgdGh1bWJIZWlnaHQgPSBNYXRoLnJvdW5kKDYwMCAqIHBpeGVsUmF0aW8pO1xuXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLnByb3BzLm14RXZlbnQuZ2V0Q29udGVudCgpO1xuICAgICAgICBpZiAoY29udGVudC5maWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIERvbid0IHVzZSB0aGUgdGh1bWJuYWlsIGZvciBjbGllbnRzIHdpc2hpbmcgdG8gYXV0b3BsYXkgZ2lmcy5cbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmRlY3J5cHRlZFRodW1ibmFpbFVybCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXRlLmRlY3J5cHRlZFRodW1ibmFpbFVybDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXRlLmRlY3J5cHRlZFVybDtcbiAgICAgICAgfSBlbHNlIGlmIChjb250ZW50LmluZm8gJiYgY29udGVudC5pbmZvLm1pbWV0eXBlID09PSBcImltYWdlL3N2Zyt4bWxcIiAmJiBjb250ZW50LmluZm8udGh1bWJuYWlsX3VybCkge1xuICAgICAgICAgICAgLy8gc3BlY2lhbCBjYXNlIHRvIHJldHVybiBjbGllbnRzaWRlIHNlbmRlci1nZW5lcmF0ZWQgdGh1bWJuYWlscyBmb3IgU1ZHcywgaWYgYW55LFxuICAgICAgICAgICAgLy8gZ2l2ZW4gd2UgZGVsaWJlcmF0ZWx5IGRvbid0IHRodW1ibmFpbCB0aGVtIHNlcnZlcnNpZGUgdG8gcHJldmVudFxuICAgICAgICAgICAgLy8gYmlsbGlvbiBsb2wgYXR0YWNrcyBhbmQgc2ltaWxhclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29udGV4dC5teGNVcmxUb0h0dHAoXG4gICAgICAgICAgICAgICAgY29udGVudC5pbmZvLnRodW1ibmFpbF91cmwsXG4gICAgICAgICAgICAgICAgdGh1bWJXaWR0aCxcbiAgICAgICAgICAgICAgICB0aHVtYkhlaWdodCxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB3ZSB0cnkgdG8gZG93bmxvYWQgdGhlIGNvcnJlY3QgcmVzb2x1dGlvblxuICAgICAgICAgICAgLy8gZm9yIGhpLXJlcyBpbWFnZXMgKGxpa2UgcmV0aW5hIHNjcmVlbnNob3RzKS5cbiAgICAgICAgICAgIC8vIHN5bmFwc2Ugb25seSBzdXBwb3J0cyA4MDB4NjAwIHRodW1ibmFpbHMgZm9yIG5vdyB0aG91Z2gsXG4gICAgICAgICAgICAvLyBzbyB3ZSdsbCBuZWVkIHRvIGRvd25sb2FkIHRoZSBvcmlnaW5hbCBpbWFnZSBmb3IgdGhpcyB0byB3b3JrXG4gICAgICAgICAgICAvLyB3ZWxsIGZvciBub3cuIEZpcnN0LCBsZXQncyB0cnkgYSBmZXcgY2FzZXMgdGhhdCBsZXQgdXMgYXZvaWRcbiAgICAgICAgICAgIC8vIGRvd25sb2FkaW5nIHRoZSBvcmlnaW5hbCwgaW5jbHVkaW5nOlxuICAgICAgICAgICAgLy8gICAtIFdoZW4gZGlzcGxheWluZyBhIEdJRiwgd2UgYWx3YXlzIHdhbnQgdG8gdGh1bWJuYWlsIHNvIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyAgICAgcHJvcGVybHkgcmVzcGVjdCB0aGUgdXNlcidzIEdJRiBhdXRvcGxheSBzZXR0aW5nICh3aGljaCByZWxpZXMgb25cbiAgICAgICAgICAgIC8vICAgICB0aHVtYm5haWxpbmcgdG8gcHJvZHVjZSB0aGUgc3RhdGljIHByZXZpZXcgaW1hZ2UpXG4gICAgICAgICAgICAvLyAgIC0gT24gYSBsb3cgRFBJIGRldmljZSwgYWx3YXlzIHRodW1ibmFpbCB0byBzYXZlIGJhbmR3aWR0aFxuICAgICAgICAgICAgLy8gICAtIElmIHRoZXJlJ3Mgbm8gc2l6aW5nIGluZm8gaW4gdGhlIGV2ZW50LCBkZWZhdWx0IHRvIHRodW1ibmFpbFxuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGNvbnRlbnQuaW5mbztcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICB0aGlzLl9pc0dpZigpIHx8XG4gICAgICAgICAgICAgICAgcGl4ZWxSYXRpbyA9PT0gMS4wIHx8XG4gICAgICAgICAgICAgICAgKCFpbmZvIHx8ICFpbmZvLncgfHwgIWluZm8uaCB8fCAhaW5mby5zaXplKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29udGV4dC5teGNVcmxUb0h0dHAoY29udGVudC51cmwsIHRodW1iV2lkdGgsIHRodW1iSGVpZ2h0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gd2Ugc2hvdWxkIG9ubHkgcmVxdWVzdCB0aHVtYm5haWxzIGlmIHRoZSBpbWFnZSBpcyBiaWdnZXIgdGhhbiA4MDB4NjAwXG4gICAgICAgICAgICAgICAgLy8gKG9yIDE2MDB4MTIwMCBvbiByZXRpbmEpIG90aGVyd2lzZSB0aGUgaW1hZ2UgaW4gdGhlIHRpbWVsaW5lIHdpbGwganVzdFxuICAgICAgICAgICAgICAgIC8vIGVuZCB1cCByZXNhbXBsZWQgYW5kIGRlLXJldGluYSdkIGZvciBubyBnb29kIHJlYXNvbi5cbiAgICAgICAgICAgICAgICAvLyBJZGVhbGx5IHRoZSBzZXJ2ZXIgd291bGQgcHJlZ2VuIDE2MDB4MTIwMCB0aHVtYm5haWxzIGluIG9yZGVyIHRvIHByb3ZpZGUgcmV0aW5hXG4gICAgICAgICAgICAgICAgLy8gdGh1bWJuYWlscywgYnV0IHdlIGRvbid0IGRvIHRoaXMgY3VycmVudGx5IGluIHN5bmFwc2UgZm9yIGZlYXIgb2YgZGlzayBzcGFjZS5cbiAgICAgICAgICAgICAgICAvLyBBcyBhIGNvbXByb21pc2UsIGxldCdzIHN3aXRjaCB0byBub24tcmV0aW5hIHRodW1ibmFpbHMgb25seSBpZiB0aGUgb3JpZ2luYWxcbiAgICAgICAgICAgICAgICAvLyBpbWFnZSBpcyBib3RoIHBoeXNpY2FsbHkgdG9vIGxhcmdlIGFuZCBnb2luZyB0byBiZSBtYXNzaXZlIHRvIGxvYWQgaW4gdGhlXG4gICAgICAgICAgICAgICAgLy8gdGltZWxpbmUgKGUuZy4gPjFNQikuXG5cbiAgICAgICAgICAgICAgICBjb25zdCBpc0xhcmdlclRoYW5UaHVtYm5haWwgPSAoXG4gICAgICAgICAgICAgICAgICAgIGluZm8udyA+IHRodW1iV2lkdGggfHxcbiAgICAgICAgICAgICAgICAgICAgaW5mby5oID4gdGh1bWJIZWlnaHRcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzTGFyZ2VGaWxlU2l6ZSA9IGluZm8uc2l6ZSA+IDEqMTAyNCoxMDI0O1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzTGFyZ2VGaWxlU2l6ZSAmJiBpc0xhcmdlclRoYW5UaHVtYm5haWwpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaW1hZ2UgaXMgdG9vIGxhcmdlIHBoeXNpY2FsbHkgYW5kIGJ5dGV3aXNlIHRvIGNsdXR0ZXIgb3VyIHRpbWVsaW5lIHNvXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIGFzayBmb3IgYSB0aHVtYm5haWwsIGRlc3BpdGUga25vd2luZyB0aGF0IGl0IHdpbGwgYmUgbWF4IDgwMHg2MDBcbiAgICAgICAgICAgICAgICAgICAgLy8gZGVzcGl0ZSB1cyBiZWluZyByZXRpbmEgKGFzIHN5bmFwc2UgZG9lc24ndCBkbyAxNjAweDEyMDAgdGh1bWJzIHlldCkuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbnRleHQubXhjVXJsVG9IdHRwKFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudC51cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHVtYldpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGh1bWJIZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZG93bmxvYWQgdGhlIG9yaWdpbmFsIGltYWdlIG90aGVyd2lzZSwgc28gd2UgY2FuIHNjYWxlIGl0IGNsaWVudCBzaWRlXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIHRha2UgcGl4ZWxSYXRpbyBpbnRvIGFjY291bnQuXG4gICAgICAgICAgICAgICAgICAgIC8vICggbm8gd2lkdGgvaGVpZ2h0IG1lYW5zIHdlIHdhbnQgdGhlIG9yaWdpbmFsIGltYWdlKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb250ZXh0Lm14Y1VybFRvSHR0cChcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQudXJsLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICB0aGlzLnVubW91bnRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNvbnRleHQub24oJ3N5bmMnLCB0aGlzLm9uQ2xpZW50U3luYyk7XG5cbiAgICAgICAgY29uc3QgY29udGVudCA9IHRoaXMucHJvcHMubXhFdmVudC5nZXRDb250ZW50KCk7XG4gICAgICAgIGlmIChjb250ZW50LmZpbGUgIT09IHVuZGVmaW5lZCAmJiB0aGlzLnN0YXRlLmRlY3J5cHRlZFVybCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IHRodW1ibmFpbFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICBpZiAoY29udGVudC5pbmZvICYmIGNvbnRlbnQuaW5mby50aHVtYm5haWxfZmlsZSkge1xuICAgICAgICAgICAgICAgIHRodW1ibmFpbFByb21pc2UgPSBkZWNyeXB0RmlsZShcbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5pbmZvLnRodW1ibmFpbF9maWxlLFxuICAgICAgICAgICAgICAgICkudGhlbihmdW5jdGlvbihibG9iKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGRlY3J5cHRlZEJsb2I7XG4gICAgICAgICAgICB0aHVtYm5haWxQcm9taXNlLnRoZW4oKHRodW1ibmFpbFVybCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBkZWNyeXB0RmlsZShjb250ZW50LmZpbGUpLnRoZW4oZnVuY3Rpb24oYmxvYikge1xuICAgICAgICAgICAgICAgICAgICBkZWNyeXB0ZWRCbG9iID0gYmxvYjtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgICAgICAgICAgICAgfSkudGhlbigoY29udGVudFVybCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy51bm1vdW50ZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWNyeXB0ZWRVcmw6IGNvbnRlbnRVcmwsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWNyeXB0ZWRUaHVtYm5haWxVcmw6IHRodW1ibmFpbFVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlY3J5cHRlZEJsb2I6IGRlY3J5cHRlZEJsb2IsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnVubW91bnRlZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIlVuYWJsZSB0byBkZWNyeXB0IGF0dGFjaG1lbnQ6IFwiLCBlcnIpO1xuICAgICAgICAgICAgICAgIC8vIFNldCBhIHBsYWNlaG9sZGVyIGltYWdlIHdoZW4gd2UgY2FuJ3QgZGVjcnlwdCB0aGUgaW1hZ2UuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnIsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbWVtYmVyIHRoYXQgdGhlIHVzZXIgd2FudGVkIHRvIHNob3cgdGhpcyBwYXJ0aWN1bGFyIGltYWdlXG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5zaG93SW1hZ2UgJiYgbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJteF9TaG93SW1hZ2VfXCIgKyB0aGlzLnByb3BzLm14RXZlbnQuZ2V0SWQoKSkgPT09IFwidHJ1ZVwiKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93SW1hZ2U6IHRydWV9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2FmdGVyQ29tcG9uZW50RGlkTW91bnQoKTtcbiAgICB9XG5cbiAgICAvLyBUbyBiZSBvdmVycmlkZGVuIGJ5IHN1YmNsYXNzZXMgKGUuZy4gTVN0aWNrZXJCb2R5KSBmb3IgZnVydGhlclxuICAgIC8vIGluaXRpYWxpc2F0aW9uIGFmdGVyIGNvbXBvbmVudERpZE1vdW50XG4gICAgX2FmdGVyQ29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgfVxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIHRoaXMudW5tb3VudGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5jb250ZXh0LnJlbW92ZUxpc3RlbmVyKCdzeW5jJywgdGhpcy5vbkNsaWVudFN5bmMpO1xuICAgICAgICB0aGlzLl9hZnRlckNvbXBvbmVudFdpbGxVbm1vdW50KCk7XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZGVjcnlwdGVkVXJsKSB7XG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKHRoaXMuc3RhdGUuZGVjcnlwdGVkVXJsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kZWNyeXB0ZWRUaHVtYm5haWxVcmwpIHtcbiAgICAgICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwodGhpcy5zdGF0ZS5kZWNyeXB0ZWRUaHVtYm5haWxVcmwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gVG8gYmUgb3ZlcnJpZGRlbiBieSBzdWJjbGFzc2VzIChlLmcuIE1TdGlja2VyQm9keSkgZm9yIGZ1cnRoZXJcbiAgICAvLyBjbGVhbnVwIGFmdGVyIGNvbXBvbmVudFdpbGxVbm1vdW50XG4gICAgX2FmdGVyQ29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgfVxuXG4gICAgX21lc3NhZ2VDb250ZW50KGNvbnRlbnRVcmwsIHRodW1iVXJsLCBjb250ZW50KSB7XG4gICAgICAgIGxldCBpbmZvV2lkdGg7XG4gICAgICAgIGxldCBpbmZvSGVpZ2h0O1xuXG4gICAgICAgIGlmIChjb250ZW50ICYmIGNvbnRlbnQuaW5mbyAmJiBjb250ZW50LmluZm8udyAmJiBjb250ZW50LmluZm8uaCkge1xuICAgICAgICAgICAgaW5mb1dpZHRoID0gY29udGVudC5pbmZvLnc7XG4gICAgICAgICAgICBpbmZvSGVpZ2h0ID0gY29udGVudC5pbmZvLmg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBXaGlsc3QgdGhlIGltYWdlIGxvYWRzLCBkaXNwbGF5IG5vdGhpbmcuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gT25jZSBsb2FkZWQsIHVzZSB0aGUgbG9hZGVkIGltYWdlIGRpbWVuc2lvbnMgc3RvcmVkIGluIGBsb2FkZWRJbWFnZURpbWVuc2lvbnNgLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEJ5IGRvaW5nIHRoaXMsIHRoZSBpbWFnZSBcInBvcHNcIiBpbnRvIHRoZSB0aW1lbGluZSwgYnV0IGlzIHN0aWxsIHJlc3RyaWN0ZWRcbiAgICAgICAgICAgIC8vIGJ5IHRoZSBzYW1lIHdpZHRoIGFuZCBoZWlnaHQgbG9naWMgYmVsb3cuXG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGUubG9hZGVkSW1hZ2VEaW1lbnNpb25zKSB7XG4gICAgICAgICAgICAgICAgbGV0IGltYWdlRWxlbWVudDtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGUuc2hvd0ltYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIGltYWdlRWxlbWVudCA9IDxIaWRkZW5JbWFnZVBsYWNlaG9sZGVyIC8+O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGltYWdlRWxlbWVudCA9IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3R5bGU9e3tkaXNwbGF5OiAnbm9uZSd9fSBzcmM9e3RodW1iVXJsfSByZWY9e3RoaXMuX2ltYWdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbHQ9e2NvbnRlbnQuYm9keX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25FcnJvcj17dGhpcy5vbkltYWdlRXJyb3J9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uTG9hZD17dGhpcy5vbkltYWdlTG9hZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndyYXBJbWFnZShjb250ZW50VXJsLCBpbWFnZUVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5mb1dpZHRoID0gdGhpcy5zdGF0ZS5sb2FkZWRJbWFnZURpbWVuc2lvbnMubmF0dXJhbFdpZHRoO1xuICAgICAgICAgICAgaW5mb0hlaWdodCA9IHRoaXMuc3RhdGUubG9hZGVkSW1hZ2VEaW1lbnNpb25zLm5hdHVyYWxIZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgbWF4aW11bSBoZWlnaHQgb2YgdGhlIHRodW1ibmFpbCBhcyBpdCBpcyByZW5kZXJlZCBhcyBhbiA8aW1nPlxuICAgICAgICBjb25zdCBtYXhIZWlnaHQgPSBNYXRoLm1pbih0aGlzLnByb3BzLm1heEltYWdlSGVpZ2h0IHx8IDYwMCwgaW5mb0hlaWdodCk7XG4gICAgICAgIC8vIFRoZSBtYXhpbXVtIHdpZHRoIG9mIHRoZSB0aHVtYm5haWwsIGFzIGRpY3RhdGVkIGJ5IGl0cyBuYXR1cmFsXG4gICAgICAgIC8vIG1heGltdW0gaGVpZ2h0LlxuICAgICAgICBjb25zdCBtYXhXaWR0aCA9IGluZm9XaWR0aCAqIG1heEhlaWdodCAvIGluZm9IZWlnaHQ7XG5cbiAgICAgICAgbGV0IGltZyA9IG51bGw7XG4gICAgICAgIGxldCBwbGFjZWhvbGRlciA9IG51bGw7XG4gICAgICAgIGxldCBnaWZMYWJlbCA9IG51bGw7XG5cbiAgICAgICAgLy8gZTJlIGltYWdlIGhhc24ndCBiZWVuIGRlY3J5cHRlZCB5ZXRcbiAgICAgICAgaWYgKGNvbnRlbnQuZmlsZSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuc3RhdGUuZGVjcnlwdGVkVXJsID09PSBudWxsKSB7XG4gICAgICAgICAgICBwbGFjZWhvbGRlciA9IDxpbWdcbiAgICAgICAgICAgICAgICBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL3NwaW5uZXIuZ2lmXCIpfVxuICAgICAgICAgICAgICAgIGFsdD17Y29udGVudC5ib2R5fVxuICAgICAgICAgICAgICAgIHdpZHRoPVwiMzJcIlxuICAgICAgICAgICAgICAgIGhlaWdodD1cIjMyXCJcbiAgICAgICAgICAgIC8+O1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLnN0YXRlLmltZ0xvYWRlZCkge1xuICAgICAgICAgICAgLy8gRGVsaWJlcmF0ZWx5LCBnZXRTcGlubmVyIGlzIGxlZnQgdW5pbXBsZW1lbnRlZCBoZXJlLCBNU3RpY2tlckJvZHkgb3ZlcmlkZXNcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gdGhpcy5nZXRQbGFjZWhvbGRlcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHNob3dQbGFjZWhvbGRlciA9IEJvb2xlYW4ocGxhY2Vob2xkZXIpO1xuXG4gICAgICAgIGlmICh0aHVtYlVybCAmJiAhdGhpcy5zdGF0ZS5pbWdFcnJvcikge1xuICAgICAgICAgICAgLy8gUmVzdHJpY3QgdGhlIHdpZHRoIG9mIHRoZSB0aHVtYm5haWwgaGVyZSwgb3RoZXJ3aXNlIGl0IHdpbGwgZmlsbCB0aGUgY29udGFpbmVyXG4gICAgICAgICAgICAvLyB3aGljaCBoYXMgdGhlIHNhbWUgd2lkdGggYXMgdGhlIHRpbWVsaW5lXG4gICAgICAgICAgICAvLyBteF9NSW1hZ2VCb2R5X3RodW1ibmFpbCByZXNpemVzIGltZyB0byBleGFjdGx5IGNvbnRhaW5lciBzaXplXG4gICAgICAgICAgICBpbWcgPSAoXG4gICAgICAgICAgICAgICAgPGltZyBjbGFzc05hbWU9XCJteF9NSW1hZ2VCb2R5X3RodW1ibmFpbFwiIHNyYz17dGh1bWJVcmx9IHJlZj17dGhpcy5faW1hZ2V9XG4gICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBtYXhXaWR0aDogbWF4V2lkdGggKyBcInB4XCIgfX1cbiAgICAgICAgICAgICAgICAgICAgIGFsdD17Y29udGVudC5ib2R5fVxuICAgICAgICAgICAgICAgICAgICAgb25FcnJvcj17dGhpcy5vbkltYWdlRXJyb3J9XG4gICAgICAgICAgICAgICAgICAgICBvbkxvYWQ9e3RoaXMub25JbWFnZUxvYWR9XG4gICAgICAgICAgICAgICAgICAgICBvbk1vdXNlRW50ZXI9e3RoaXMub25JbWFnZUVudGVyfVxuICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUxlYXZlPXt0aGlzLm9uSW1hZ2VMZWF2ZX0gLz5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuc2hvd0ltYWdlKSB7XG4gICAgICAgICAgICBpbWcgPSA8SGlkZGVuSW1hZ2VQbGFjZWhvbGRlciBzdHlsZT17eyBtYXhXaWR0aDogbWF4V2lkdGggKyBcInB4XCIgfX0gLz47XG4gICAgICAgICAgICBzaG93UGxhY2Vob2xkZXIgPSBmYWxzZTsgLy8gYmVjYXVzZSB3ZSdyZSBoaWRpbmcgdGhlIGltYWdlLCBzbyBkb24ndCBzaG93IHRoZSBzdGlja2VyIGljb24uXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5faXNHaWYoKSAmJiAhU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImF1dG9wbGF5R2lmc0FuZFZpZGVvc1wiKSAmJiAhdGhpcy5zdGF0ZS5ob3Zlcikge1xuICAgICAgICAgICAgZ2lmTGFiZWwgPSA8cCBjbGFzc05hbWU9XCJteF9NSW1hZ2VCb2R5X2dpZkxhYmVsXCI+R0lGPC9wPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRodW1ibmFpbCA9IChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTUltYWdlQm9keV90aHVtYm5haWxfY29udGFpbmVyXCIgc3R5bGU9e3sgbWF4SGVpZ2h0OiBtYXhIZWlnaHQgKyBcInB4XCIgfX0gPlxuICAgICAgICAgICAgICAgIHsgLyogQ2FsY3VsYXRlIGFzcGVjdCByYXRpbywgdXNpbmcgJXBhZGRpbmcgd2lsbCBzaXplIF9jb250YWluZXIgY29ycmVjdGx5ICovIH1cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IHBhZGRpbmdCb3R0b206ICgxMDAgKiBpbmZvSGVpZ2h0IC8gaW5mb1dpZHRoKSArICclJyB9fSAvPlxuICAgICAgICAgICAgICAgIHsgc2hvd1BsYWNlaG9sZGVyICYmXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTUltYWdlQm9keV90aHVtYm5haWxcIiBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29uc3RyYWluIHdpZHRoIGhlcmUgc28gdGhhdCBzcGlubmVyIGFwcGVhcnMgY2VudHJhbCB0byB0aGUgbG9hZGVkIHRodW1ibmFpbFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGg6IGluZm9XaWR0aCArIFwicHhcIixcbiAgICAgICAgICAgICAgICAgICAgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X01JbWFnZUJvZHlfdGh1bWJuYWlsX3NwaW5uZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHBsYWNlaG9sZGVyIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7ZGlzcGxheTogIXNob3dQbGFjZWhvbGRlciA/IHVuZGVmaW5lZCA6ICdub25lJ319PlxuICAgICAgICAgICAgICAgICAgICB7IGltZyB9XG4gICAgICAgICAgICAgICAgICAgIHsgZ2lmTGFiZWwgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgeyB0aGlzLnN0YXRlLmhvdmVyICYmIHRoaXMuZ2V0VG9vbHRpcCgpIH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiB0aGlzLndyYXBJbWFnZShjb250ZW50VXJsLCB0aHVtYm5haWwpO1xuICAgIH1cblxuICAgIC8vIE92ZXJpZGRlbiBieSBNU3RpY2tlckJvZHlcbiAgICB3cmFwSW1hZ2UoY29udGVudFVybCwgY2hpbGRyZW4pIHtcbiAgICAgICAgcmV0dXJuIDxhIGhyZWY9e2NvbnRlbnRVcmx9IG9uQ2xpY2s9e3RoaXMub25DbGlja30+XG4gICAgICAgICAgICB7Y2hpbGRyZW59XG4gICAgICAgIDwvYT47XG4gICAgfVxuXG4gICAgLy8gT3ZlcmlkZGVuIGJ5IE1TdGlja2VyQm9keVxuICAgIGdldFBsYWNlaG9sZGVyKCkge1xuICAgICAgICAvLyBNSW1hZ2VCb2R5IGRvZXNuJ3Qgc2hvdyBhIHBsYWNlaG9sZGVyIHdoaWxzdCB0aGUgaW1hZ2UgbG9hZHMsIChidXQgaXQgY291bGQgZG8pXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIE92ZXJpZGRlbiBieSBNU3RpY2tlckJvZHlcbiAgICBnZXRUb29sdGlwKCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBPdmVyaWRkZW4gYnkgTVN0aWNrZXJCb2R5XG4gICAgZ2V0RmlsZUJvZHkoKSB7XG4gICAgICAgIHJldHVybiA8TUZpbGVCb2R5IHsuLi50aGlzLnByb3BzfSBkZWNyeXB0ZWRCbG9iPXt0aGlzLnN0YXRlLmRlY3J5cHRlZEJsb2J9IC8+O1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgY29udGVudCA9IHRoaXMucHJvcHMubXhFdmVudC5nZXRDb250ZW50KCk7XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZXJyb3IgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfTUltYWdlQm9keVwiPlxuICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvd2FybmluZy5zdmdcIil9IHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIC8+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoXCJFcnJvciBkZWNyeXB0aW5nIGltYWdlXCIpIH1cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29udGVudFVybCA9IHRoaXMuX2dldENvbnRlbnRVcmwoKTtcbiAgICAgICAgbGV0IHRodW1iVXJsO1xuICAgICAgICBpZiAodGhpcy5faXNHaWYoKSAmJiBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwiYXV0b3BsYXlHaWZzQW5kVmlkZW9zXCIpKSB7XG4gICAgICAgICAgdGh1bWJVcmwgPSBjb250ZW50VXJsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRodW1iVXJsID0gdGhpcy5fZ2V0VGh1bWJVcmwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRodW1ibmFpbCA9IHRoaXMuX21lc3NhZ2VDb250ZW50KGNvbnRlbnRVcmwsIHRodW1iVXJsLCBjb250ZW50KTtcbiAgICAgICAgY29uc3QgZmlsZUJvZHkgPSB0aGlzLmdldEZpbGVCb2R5KCk7XG5cbiAgICAgICAgcmV0dXJuIDxzcGFuIGNsYXNzTmFtZT1cIm14X01JbWFnZUJvZHlcIj5cbiAgICAgICAgICAgIHsgdGh1bWJuYWlsIH1cbiAgICAgICAgICAgIHsgZmlsZUJvZHkgfVxuICAgICAgICA8L3NwYW4+O1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEhpZGRlbkltYWdlUGxhY2Vob2xkZXIgZXh0ZW5kcyBSZWFjdC5QdXJlQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBob3ZlcjogUHJvcFR5cGVzLmJvb2wsXG4gICAgfTtcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGNsYXNzTmFtZSA9ICdteF9IaWRkZW5JbWFnZVBsYWNlaG9sZGVyJztcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuaG92ZXIpIGNsYXNzTmFtZSArPSAnIG14X0hpZGRlbkltYWdlUGxhY2Vob2xkZXJfaG92ZXInO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzTmFtZX0+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X0hpZGRlbkltYWdlUGxhY2Vob2xkZXJfYnV0dG9uJz5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdteF9IaWRkZW5JbWFnZVBsYWNlaG9sZGVyX2V5ZScgLz5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+e190KFwiU2hvdyBpbWFnZVwiKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=