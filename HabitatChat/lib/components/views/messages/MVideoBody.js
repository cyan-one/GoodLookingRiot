"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _MFileBody = _interopRequireDefault(require("./MFileBody"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _DecryptFile = require("../../../utils/DecryptFile");

var _languageHandler = require("../../../languageHandler");

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

/*
Copyright 2015, 2016 OpenMarket Ltd
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
  displayName: 'MVideoBody',
  propTypes: {
    /* the MatrixEvent to show */
    mxEvent: _propTypes.default.object.isRequired,

    /* called when the video has loaded */
    onHeightChanged: _propTypes.default.func.isRequired
  },
  getInitialState: function () {
    return {
      decryptedUrl: null,
      decryptedThumbnailUrl: null,
      decryptedBlob: null,
      error: null
    };
  },
  thumbScale: function (fullWidth, fullHeight, thumbWidth, thumbHeight) {
    if (!fullWidth || !fullHeight) {
      // Cannot calculate thumbnail height for image: missing w/h in metadata. We can't even
      // log this because it's spammy
      return undefined;
    }

    if (fullWidth < thumbWidth && fullHeight < thumbHeight) {
      // no scaling needs to be applied
      return 1;
    }

    const widthMulti = thumbWidth / fullWidth;
    const heightMulti = thumbHeight / fullHeight;

    if (widthMulti < heightMulti) {
      // width is the dominant dimension so scaling will be fixed on that
      return widthMulti;
    } else {
      // height is the dominant dimension so scaling will be fixed on that
      return heightMulti;
    }
  },
  _getContentUrl: function () {
    const content = this.props.mxEvent.getContent();

    if (content.file !== undefined) {
      return this.state.decryptedUrl;
    } else {
      return _MatrixClientPeg.MatrixClientPeg.get().mxcUrlToHttp(content.url);
    }
  },
  _getThumbUrl: function () {
    const content = this.props.mxEvent.getContent();

    if (content.file !== undefined) {
      return this.state.decryptedThumbnailUrl;
    } else if (content.info && content.info.thumbnail_url) {
      return _MatrixClientPeg.MatrixClientPeg.get().mxcUrlToHttp(content.info.thumbnail_url);
    } else {
      return null;
    }
  },
  componentDidMount: function () {
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
          this.setState({
            decryptedUrl: contentUrl,
            decryptedThumbnailUrl: thumbnailUrl,
            decryptedBlob: decryptedBlob
          });
          this.props.onHeightChanged();
        });
      }).catch(err => {
        console.warn("Unable to decrypt attachment: ", err); // Set a placeholder image when we can't decrypt the image.

        this.setState({
          error: err
        });
      });
    }
  },
  componentWillUnmount: function () {
    if (this.state.decryptedUrl) {
      URL.revokeObjectURL(this.state.decryptedUrl);
    }

    if (this.state.decryptedThumbnailUrl) {
      URL.revokeObjectURL(this.state.decryptedThumbnailUrl);
    }
  },
  render: function () {
    const content = this.props.mxEvent.getContent();

    if (this.state.error !== null) {
      return /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_MVideoBody"
      }, /*#__PURE__*/_react.default.createElement("img", {
        src: require("../../../../res/img/warning.svg"),
        width: "16",
        height: "16"
      }), (0, _languageHandler._t)("Error decrypting video"));
    }

    if (content.file !== undefined && this.state.decryptedUrl === null) {
      // Need to decrypt the attachment
      // The attachment is decrypted in componentDidMount.
      // For now add an img tag with a spinner.
      return /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_MVideoBody"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_MImageBody_thumbnail mx_MImageBody_thumbnail_spinner"
      }, /*#__PURE__*/_react.default.createElement("img", {
        src: require("../../../../res/img/spinner.gif"),
        alt: content.body,
        width: "16",
        height: "16"
      })));
    }

    const contentUrl = this._getContentUrl();

    const thumbUrl = this._getThumbUrl();

    const autoplay = _SettingsStore.default.getValue("autoplayGifsAndVideos");

    let height = null;
    let width = null;
    let poster = null;
    let preload = "metadata";

    if (content.info) {
      const scale = this.thumbScale(content.info.w, content.info.h, 480, 360);

      if (scale) {
        width = Math.floor(content.info.w * scale);
        height = Math.floor(content.info.h * scale);
      }

      if (thumbUrl) {
        poster = thumbUrl;
        preload = "none";
      }
    }

    return /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_MVideoBody"
    }, /*#__PURE__*/_react.default.createElement("video", {
      className: "mx_MVideoBody",
      src: contentUrl,
      alt: content.body,
      controls: true,
      preload: preload,
      muted: autoplay,
      autoPlay: autoplay,
      height: height,
      width: width,
      poster: poster
    }), /*#__PURE__*/_react.default.createElement(_MFileBody.default, (0, _extends2.default)({}, this.props, {
      decryptedBlob: this.state.decryptedBlob
    })));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL21lc3NhZ2VzL01WaWRlb0JvZHkuanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJteEV2ZW50IiwiUHJvcFR5cGVzIiwib2JqZWN0IiwiaXNSZXF1aXJlZCIsIm9uSGVpZ2h0Q2hhbmdlZCIsImZ1bmMiLCJnZXRJbml0aWFsU3RhdGUiLCJkZWNyeXB0ZWRVcmwiLCJkZWNyeXB0ZWRUaHVtYm5haWxVcmwiLCJkZWNyeXB0ZWRCbG9iIiwiZXJyb3IiLCJ0aHVtYlNjYWxlIiwiZnVsbFdpZHRoIiwiZnVsbEhlaWdodCIsInRodW1iV2lkdGgiLCJ0aHVtYkhlaWdodCIsInVuZGVmaW5lZCIsIndpZHRoTXVsdGkiLCJoZWlnaHRNdWx0aSIsIl9nZXRDb250ZW50VXJsIiwiY29udGVudCIsInByb3BzIiwiZ2V0Q29udGVudCIsImZpbGUiLCJzdGF0ZSIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsIm14Y1VybFRvSHR0cCIsInVybCIsIl9nZXRUaHVtYlVybCIsImluZm8iLCJ0aHVtYm5haWxfdXJsIiwiY29tcG9uZW50RGlkTW91bnQiLCJ0aHVtYm5haWxQcm9taXNlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0aHVtYm5haWxfZmlsZSIsInRoZW4iLCJibG9iIiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIiwidGh1bWJuYWlsVXJsIiwiY29udGVudFVybCIsInNldFN0YXRlIiwiY2F0Y2giLCJlcnIiLCJjb25zb2xlIiwid2FybiIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwicmV2b2tlT2JqZWN0VVJMIiwicmVuZGVyIiwicmVxdWlyZSIsImJvZHkiLCJ0aHVtYlVybCIsImF1dG9wbGF5IiwiU2V0dGluZ3NTdG9yZSIsImdldFZhbHVlIiwiaGVpZ2h0Iiwid2lkdGgiLCJwb3N0ZXIiLCJwcmVsb2FkIiwic2NhbGUiLCJ3IiwiaCIsIk1hdGgiLCJmbG9vciJdLCJtYXBwaW5ncyI6Ijs7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QUssRUFBRUMsS0FGM0I7QUFFa0MsTUFBQSxNQUFNLEVBQUVDO0FBRjFDLE1BREosZUFLSSw2QkFBQyxrQkFBRCw2QkFBZSxLQUFLdEMsS0FBcEI7QUFBMkIsTUFBQSxhQUFhLEVBQUUsS0FBS0csS0FBTCxDQUFXZjtBQUFyRCxPQUxKLENBREo7QUFTSDtBQTdKMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgTUZpbGVCb2R5IGZyb20gJy4vTUZpbGVCb2R5JztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0IHsgZGVjcnlwdEZpbGUgfSBmcm9tICcuLi8uLi8uLi91dGlscy9EZWNyeXB0RmlsZSc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSBmcm9tIFwiLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBkaXNwbGF5TmFtZTogJ01WaWRlb0JvZHknLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIC8qIHRoZSBNYXRyaXhFdmVudCB0byBzaG93ICovXG4gICAgICAgIG14RXZlbnQ6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcblxuICAgICAgICAvKiBjYWxsZWQgd2hlbiB0aGUgdmlkZW8gaGFzIGxvYWRlZCAqL1xuICAgICAgICBvbkhlaWdodENoYW5nZWQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkZWNyeXB0ZWRVcmw6IG51bGwsXG4gICAgICAgICAgICBkZWNyeXB0ZWRUaHVtYm5haWxVcmw6IG51bGwsXG4gICAgICAgICAgICBkZWNyeXB0ZWRCbG9iOiBudWxsLFxuICAgICAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHRodW1iU2NhbGU6IGZ1bmN0aW9uKGZ1bGxXaWR0aCwgZnVsbEhlaWdodCwgdGh1bWJXaWR0aCwgdGh1bWJIZWlnaHQpIHtcbiAgICAgICAgaWYgKCFmdWxsV2lkdGggfHwgIWZ1bGxIZWlnaHQpIHtcbiAgICAgICAgICAgIC8vIENhbm5vdCBjYWxjdWxhdGUgdGh1bWJuYWlsIGhlaWdodCBmb3IgaW1hZ2U6IG1pc3Npbmcgdy9oIGluIG1ldGFkYXRhLiBXZSBjYW4ndCBldmVuXG4gICAgICAgICAgICAvLyBsb2cgdGhpcyBiZWNhdXNlIGl0J3Mgc3BhbW15XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmdWxsV2lkdGggPCB0aHVtYldpZHRoICYmIGZ1bGxIZWlnaHQgPCB0aHVtYkhlaWdodCkge1xuICAgICAgICAgICAgLy8gbm8gc2NhbGluZyBuZWVkcyB0byBiZSBhcHBsaWVkXG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB3aWR0aE11bHRpID0gdGh1bWJXaWR0aCAvIGZ1bGxXaWR0aDtcbiAgICAgICAgY29uc3QgaGVpZ2h0TXVsdGkgPSB0aHVtYkhlaWdodCAvIGZ1bGxIZWlnaHQ7XG4gICAgICAgIGlmICh3aWR0aE11bHRpIDwgaGVpZ2h0TXVsdGkpIHtcbiAgICAgICAgICAgIC8vIHdpZHRoIGlzIHRoZSBkb21pbmFudCBkaW1lbnNpb24gc28gc2NhbGluZyB3aWxsIGJlIGZpeGVkIG9uIHRoYXRcbiAgICAgICAgICAgIHJldHVybiB3aWR0aE11bHRpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gaGVpZ2h0IGlzIHRoZSBkb21pbmFudCBkaW1lbnNpb24gc28gc2NhbGluZyB3aWxsIGJlIGZpeGVkIG9uIHRoYXRcbiAgICAgICAgICAgIHJldHVybiBoZWlnaHRNdWx0aTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfZ2V0Q29udGVudFVybDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLnByb3BzLm14RXZlbnQuZ2V0Q29udGVudCgpO1xuICAgICAgICBpZiAoY29udGVudC5maWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXRlLmRlY3J5cHRlZFVybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkubXhjVXJsVG9IdHRwKGNvbnRlbnQudXJsKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfZ2V0VGh1bWJVcmw6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gdGhpcy5wcm9wcy5teEV2ZW50LmdldENvbnRlbnQoKTtcbiAgICAgICAgaWYgKGNvbnRlbnQuZmlsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5kZWNyeXB0ZWRUaHVtYm5haWxVcmw7XG4gICAgICAgIH0gZWxzZSBpZiAoY29udGVudC5pbmZvICYmIGNvbnRlbnQuaW5mby50aHVtYm5haWxfdXJsKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0cml4Q2xpZW50UGVnLmdldCgpLm14Y1VybFRvSHR0cChjb250ZW50LmluZm8udGh1bWJuYWlsX3VybCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLnByb3BzLm14RXZlbnQuZ2V0Q29udGVudCgpO1xuICAgICAgICBpZiAoY29udGVudC5maWxlICE9PSB1bmRlZmluZWQgJiYgdGhpcy5zdGF0ZS5kZWNyeXB0ZWRVcmwgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGxldCB0aHVtYm5haWxQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgaWYgKGNvbnRlbnQuaW5mbyAmJiBjb250ZW50LmluZm8udGh1bWJuYWlsX2ZpbGUpIHtcbiAgICAgICAgICAgICAgICB0aHVtYm5haWxQcm9taXNlID0gZGVjcnlwdEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQuaW5mby50aHVtYm5haWxfZmlsZSxcbiAgICAgICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24oYmxvYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBkZWNyeXB0ZWRCbG9iO1xuICAgICAgICAgICAgdGh1bWJuYWlsUHJvbWlzZS50aGVuKCh0aHVtYm5haWxVcmwpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVjcnlwdEZpbGUoY29udGVudC5maWxlKS50aGVuKGZ1bmN0aW9uKGJsb2IpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVjcnlwdGVkQmxvYiA9IGJsb2I7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAgICAgICAgICAgIH0pLnRoZW4oKGNvbnRlbnRVcmwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWNyeXB0ZWRVcmw6IGNvbnRlbnRVcmwsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWNyeXB0ZWRUaHVtYm5haWxVcmw6IHRodW1ibmFpbFVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlY3J5cHRlZEJsb2I6IGRlY3J5cHRlZEJsb2IsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm9uSGVpZ2h0Q2hhbmdlZCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIlVuYWJsZSB0byBkZWNyeXB0IGF0dGFjaG1lbnQ6IFwiLCBlcnIpO1xuICAgICAgICAgICAgICAgIC8vIFNldCBhIHBsYWNlaG9sZGVyIGltYWdlIHdoZW4gd2UgY2FuJ3QgZGVjcnlwdCB0aGUgaW1hZ2UuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnIsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmRlY3J5cHRlZFVybCkge1xuICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh0aGlzLnN0YXRlLmRlY3J5cHRlZFVybCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZGVjcnlwdGVkVGh1bWJuYWlsVXJsKSB7XG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKHRoaXMuc3RhdGUuZGVjcnlwdGVkVGh1bWJuYWlsVXJsKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gdGhpcy5wcm9wcy5teEV2ZW50LmdldENvbnRlbnQoKTtcblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5lcnJvciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9NVmlkZW9Cb2R5XCI+XG4gICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy93YXJuaW5nLnN2Z1wiKX0gd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgeyBfdChcIkVycm9yIGRlY3J5cHRpbmcgdmlkZW9cIikgfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29udGVudC5maWxlICE9PSB1bmRlZmluZWQgJiYgdGhpcy5zdGF0ZS5kZWNyeXB0ZWRVcmwgPT09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIE5lZWQgdG8gZGVjcnlwdCB0aGUgYXR0YWNobWVudFxuICAgICAgICAgICAgLy8gVGhlIGF0dGFjaG1lbnQgaXMgZGVjcnlwdGVkIGluIGNvbXBvbmVudERpZE1vdW50LlxuICAgICAgICAgICAgLy8gRm9yIG5vdyBhZGQgYW4gaW1nIHRhZyB3aXRoIGEgc3Bpbm5lci5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfTVZpZGVvQm9keVwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X01JbWFnZUJvZHlfdGh1bWJuYWlsIG14X01JbWFnZUJvZHlfdGh1bWJuYWlsX3NwaW5uZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9zcGlubmVyLmdpZlwiKX0gYWx0PXtjb250ZW50LmJvZHl9IHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIC8+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb250ZW50VXJsID0gdGhpcy5fZ2V0Q29udGVudFVybCgpO1xuICAgICAgICBjb25zdCB0aHVtYlVybCA9IHRoaXMuX2dldFRodW1iVXJsKCk7XG4gICAgICAgIGNvbnN0IGF1dG9wbGF5ID0gU2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImF1dG9wbGF5R2lmc0FuZFZpZGVvc1wiKTtcbiAgICAgICAgbGV0IGhlaWdodCA9IG51bGw7XG4gICAgICAgIGxldCB3aWR0aCA9IG51bGw7XG4gICAgICAgIGxldCBwb3N0ZXIgPSBudWxsO1xuICAgICAgICBsZXQgcHJlbG9hZCA9IFwibWV0YWRhdGFcIjtcbiAgICAgICAgaWYgKGNvbnRlbnQuaW5mbykge1xuICAgICAgICAgICAgY29uc3Qgc2NhbGUgPSB0aGlzLnRodW1iU2NhbGUoY29udGVudC5pbmZvLncsIGNvbnRlbnQuaW5mby5oLCA0ODAsIDM2MCk7XG4gICAgICAgICAgICBpZiAoc2NhbGUpIHtcbiAgICAgICAgICAgICAgICB3aWR0aCA9IE1hdGguZmxvb3IoY29udGVudC5pbmZvLncgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gTWF0aC5mbG9vcihjb250ZW50LmluZm8uaCAqIHNjYWxlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRodW1iVXJsKSB7XG4gICAgICAgICAgICAgICAgcG9zdGVyID0gdGh1bWJVcmw7XG4gICAgICAgICAgICAgICAgcHJlbG9hZCA9IFwibm9uZVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9NVmlkZW9Cb2R5XCI+XG4gICAgICAgICAgICAgICAgPHZpZGVvIGNsYXNzTmFtZT1cIm14X01WaWRlb0JvZHlcIiBzcmM9e2NvbnRlbnRVcmx9IGFsdD17Y29udGVudC5ib2R5fVxuICAgICAgICAgICAgICAgICAgICBjb250cm9scyBwcmVsb2FkPXtwcmVsb2FkfSBtdXRlZD17YXV0b3BsYXl9IGF1dG9QbGF5PXthdXRvcGxheX1cbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0PXtoZWlnaHR9IHdpZHRoPXt3aWR0aH0gcG9zdGVyPXtwb3N0ZXJ9PlxuICAgICAgICAgICAgICAgIDwvdmlkZW8+XG4gICAgICAgICAgICAgICAgPE1GaWxlQm9keSB7Li4udGhpcy5wcm9wc30gZGVjcnlwdGVkQmxvYj17dGhpcy5zdGF0ZS5kZWNyeXB0ZWRCbG9ifSAvPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==