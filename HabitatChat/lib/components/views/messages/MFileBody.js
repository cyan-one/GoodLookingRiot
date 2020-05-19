"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _filesize = _interopRequireDefault(require("filesize"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _DecryptFile = require("../../../utils/DecryptFile");

var _Tinter = _interopRequireDefault(require("../../../Tinter"));

var _browserRequest = _interopRequireDefault(require("browser-request"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2018 New Vector Ltd

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
// A cached tinted copy of require("../../../../res/img/download.svg")
let tintedDownloadImageURL; // Track a list of mounted MFileBody instances so that we can update
// the require("../../../../res/img/download.svg") when the tint changes.

let nextMountId = 0;
const mounts = {};
/**
 * Updates the tinted copy of require("../../../../res/img/download.svg") when the tint changes.
 */

function updateTintedDownloadImage() {
  // Download the svg as an XML document.
  // We could cache the XML response here, but since the tint rarely changes
  // it's probably not worth it.
  // Also note that we can't use fetch here because fetch doesn't support
  // file URLs, which the download image will be if we're running from
  // the filesystem (like in an Electron wrapper).
  (0, _browserRequest.default)({
    uri: require("../../../../res/img/download.svg")
  }, (err, response, body) => {
    if (err) return;
    const svg = new DOMParser().parseFromString(body, "image/svg+xml"); // Apply the fixups to the XML.

    const fixups = _Tinter.default.calcSvgFixups([{
      contentDocument: svg
    }]);

    _Tinter.default.applySvgFixups(fixups); // Encoded the fixed up SVG as a data URL.


    const svgString = new XMLSerializer().serializeToString(svg);
    tintedDownloadImageURL = "data:image/svg+xml;base64," + window.btoa(svgString); // Notify each mounted MFileBody that the URL has changed.

    Object.keys(mounts).forEach(function (id) {
      mounts[id].tint();
    });
  });
}

_Tinter.default.registerTintable(updateTintedDownloadImage); // User supplied content can contain scripts, we have to be careful that
// we don't accidentally run those script within the same origin as the
// client. Otherwise those scripts written by remote users can read
// the access token and end-to-end keys that are in local storage.
//
// For attachments downloaded directly from the homeserver we can use
// Content-Security-Policy headers to disable script execution.
//
// But attachments with end-to-end encryption are more difficult to handle.
// We need to decrypt the attachment on the client and then display it.
// To display the attachment we need to turn the decrypted bytes into a URL.
//
// There are two ways to turn bytes into URLs, data URL and blob URLs.
// Data URLs aren't suitable for downloading a file because Chrome has a
// 2MB limit on the size of URLs that can be viewed in the browser or
// downloaded. This limit does not seem to apply when the url is used as
// the source attribute of an image tag.
//
// Blob URLs are generated using window.URL.createObjectURL and unfortunately
// for our purposes they inherit the origin of the page that created them.
// This means that any scripts that run when the URL is viewed will be able
// to access local storage.
//
// The easiest solution is to host the code that generates the blob URL on
// a different domain to the client.
// Another possibility is to generate the blob URL within a sandboxed iframe.
// The downside of using a second domain is that it complicates hosting,
// the downside of using a sandboxed iframe is that the browers are overly
// restrictive in what you are allowed to do with the generated URL.

/**
 * Get the current CSS style for a DOMElement.
 * @param {HTMLElement} element The element to get the current style of.
 * @return {string} The CSS style encoded as a string.
 */


function computedStyle(element) {
  if (!element) {
    return "";
  }

  const style = window.getComputedStyle(element, null);
  let cssText = style.cssText;

  if (cssText == "") {
    // Firefox doesn't implement ".cssText" for computed styles.
    // https://bugzilla.mozilla.org/show_bug.cgi?id=137687
    for (let i = 0; i < style.length; i++) {
      cssText += style[i] + ":";
      cssText += style.getPropertyValue(style[i]) + ";";
    }
  }

  return cssText;
}

var _default = (0, _createReactClass.default)({
  displayName: 'MFileBody',
  getInitialState: function () {
    return {
      decryptedBlob: this.props.decryptedBlob ? this.props.decryptedBlob : null
    };
  },
  propTypes: {
    /* the MatrixEvent to show */
    mxEvent: _propTypes.default.object.isRequired,

    /* already decrypted blob */
    decryptedBlob: _propTypes.default.object,

    /* called when the download link iframe is shown */
    onHeightChanged: _propTypes.default.func,

    /* the shape of the tile, used */
    tileShape: _propTypes.default.string
  },

  /**
   * Extracts a human readable label for the file attachment to use as
   * link text.
   *
   * @params {Object} content The "content" key of the matrix event.
   * @return {string} the human readable link text for the attachment.
   */
  presentableTextForFile: function (content) {
    let linkText = (0, _languageHandler._t)("Attachment");

    if (content.body && content.body.length > 0) {
      // The content body should be the name of the file including a
      // file extension.
      linkText = content.body;
    }

    if (content.info && content.info.size) {
      // If we know the size of the file then add it as human readable
      // string to the end of the link text so that the user knows how
      // big a file they are downloading.
      // The content.info also contains a MIME-type but we don't display
      // it since it is "ugly", users generally aren't aware what it
      // means and the type of the attachment can usually be inferrered
      // from the file extension.
      linkText += ' (' + (0, _filesize.default)(content.info.size) + ')';
    }

    return linkText;
  },
  _getContentUrl: function () {
    const content = this.props.mxEvent.getContent();
    return _MatrixClientPeg.MatrixClientPeg.get().mxcUrlToHttp(content.url);
  },
  // TODO: [REACT-WARNING] Replace component with real class, use constructor for refs
  UNSAFE_componentWillMount: function () {
    this._iframe = (0, _react.createRef)();
    this._dummyLink = (0, _react.createRef)();
    this._downloadImage = (0, _react.createRef)();
  },
  componentDidMount: function () {
    // Add this to the list of mounted components to receive notifications
    // when the tint changes.
    this.id = nextMountId++;
    mounts[this.id] = this;
    this.tint();
  },
  componentDidUpdate: function (prevProps, prevState) {
    if (this.props.onHeightChanged && !prevState.decryptedBlob && this.state.decryptedBlob) {
      this.props.onHeightChanged();
    }
  },
  componentWillUnmount: function () {
    // Remove this from the list of mounted components
    delete mounts[this.id];
  },
  tint: function () {
    // Update our tinted copy of require("../../../../res/img/download.svg")
    if (this._downloadImage.current) {
      this._downloadImage.current.src = tintedDownloadImageURL;
    }

    if (this._iframe.current) {
      // If the attachment is encrypted then the download image
      // will be inside the iframe so we wont be able to update
      // it directly.
      this._iframe.current.contentWindow.postMessage({
        imgSrc: tintedDownloadImageURL,
        style: computedStyle(this._dummyLink.current)
      }, "*");
    }
  },
  render: function () {
    const content = this.props.mxEvent.getContent();
    const text = this.presentableTextForFile(content);
    const isEncrypted = content.file !== undefined;
    const fileName = content.body && content.body.length > 0 ? content.body : (0, _languageHandler._t)("Attachment");

    const contentUrl = this._getContentUrl();

    const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
    const fileSize = content.info ? content.info.size : null;
    const fileType = content.info ? content.info.mimetype : "application/octet-stream";

    if (isEncrypted) {
      if (this.state.decryptedBlob === null) {
        // Need to decrypt the attachment
        // Wait for the user to click on the link before downloading
        // and decrypting the attachment.
        let decrypting = false;

        const decrypt = e => {
          if (decrypting) {
            return false;
          }

          decrypting = true;
          (0, _DecryptFile.decryptFile)(content.file).then(blob => {
            this.setState({
              decryptedBlob: blob
            });
          }).catch(err => {
            console.warn("Unable to decrypt attachment: ", err);

            _Modal.default.createTrackedDialog('Error decrypting attachment', '', ErrorDialog, {
              title: (0, _languageHandler._t)("Error"),
              description: (0, _languageHandler._t)("Error decrypting attachment")
            });
          }).finally(() => {
            decrypting = false;
          });
        }; // This button should actually Download because usercontent/ will try to click itself
        // but it is not guaranteed between various browsers' settings.


        return /*#__PURE__*/_react.default.createElement("span", {
          className: "mx_MFileBody"
        }, /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_MFileBody_download"
        }, /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
          onClick: decrypt
        }, (0, _languageHandler._t)("Decrypt %(text)s", {
          text: text
        }))));
      } // When the iframe loads we tell it to render a download link


      const onIframeLoad = ev => {
        ev.target.contentWindow.postMessage({
          imgSrc: tintedDownloadImageURL,
          style: computedStyle(this._dummyLink.current),
          blob: this.state.decryptedBlob,
          // Set a download attribute for encrypted files so that the file
          // will have the correct name when the user tries to download it.
          // We can't provide a Content-Disposition header like we would for HTTP.
          download: fileName,
          textContent: (0, _languageHandler._t)("Download %(text)s", {
            text: text
          }),
          // only auto-download if a user triggered this iframe explicitly
          auto: !this.props.decryptedBlob
        }, "*");
      };

      const url = "usercontent/"; // XXX: this path should probably be passed from the skin
      // If the attachment is encrypted then put the link inside an iframe.

      return /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_MFileBody"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_MFileBody_download"
      }, /*#__PURE__*/_react.default.createElement("div", {
        style: {
          display: "none"
        }
      }, /*#__PURE__*/_react.default.createElement("a", {
        ref: this._dummyLink
      })), /*#__PURE__*/_react.default.createElement("iframe", {
        src: "".concat(url, "?origin=").concat(encodeURIComponent(window.location.origin)),
        onLoad: onIframeLoad,
        ref: this._iframe,
        sandbox: "allow-scripts allow-downloads allow-downloads-without-user-activation"
      })));
    } else if (contentUrl) {
      const downloadProps = {
        target: "_blank",
        rel: "noreferrer noopener",
        // We set the href regardless of whether or not we intercept the download
        // because we don't really want to convert the file to a blob eagerly, and
        // still want "open in new tab" and "save link as" to work.
        href: contentUrl
      }; // Blobs can only have up to 500mb, so if the file reports as being too large then
      // we won't try and convert it. Likewise, if the file size is unknown then we'll assume
      // it is too big. There is the risk of the reported file size and the actual file size
      // being different, however the user shouldn't normally run into this problem.

      const fileTooBig = typeof fileSize === 'number' ? fileSize > 524288000 : true;

      if (["application/pdf"].includes(fileType) && !fileTooBig) {
        // We want to force a download on this type, so use an onClick handler.
        downloadProps["onClick"] = e => {
          console.log("Downloading ".concat(fileType, " as blob (unencrypted)")); // Avoid letting the <a> do its thing

          e.preventDefault();
          e.stopPropagation(); // Start a fetch for the download
          // Based upon https://stackoverflow.com/a/49500465

          fetch(contentUrl).then(response => response.blob()).then(blob => {
            const blobUrl = URL.createObjectURL(blob); // We have to create an anchor to download the file

            const tempAnchor = document.createElement('a');
            tempAnchor.download = fileName;
            tempAnchor.href = blobUrl;
            document.body.appendChild(tempAnchor); // for firefox: https://stackoverflow.com/a/32226068

            tempAnchor.click();
            tempAnchor.remove();
          });
        };
      } else {
        // Else we are hoping the browser will do the right thing
        downloadProps["download"] = fileName;
      } // If the attachment is not encrypted then we check whether we
      // are being displayed in the room timeline or in a list of
      // files in the right hand side of the screen.


      if (this.props.tileShape === "file_grid") {
        return /*#__PURE__*/_react.default.createElement("span", {
          className: "mx_MFileBody"
        }, /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_MFileBody_download"
        }, /*#__PURE__*/_react.default.createElement("a", (0, _extends2.default)({
          className: "mx_MFileBody_downloadLink"
        }, downloadProps), fileName), /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_MImageBody_size"
        }, content.info && content.info.size ? (0, _filesize.default)(content.info.size) : "")));
      } else {
        return /*#__PURE__*/_react.default.createElement("span", {
          className: "mx_MFileBody"
        }, /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_MFileBody_download"
        }, /*#__PURE__*/_react.default.createElement("a", downloadProps, /*#__PURE__*/_react.default.createElement("img", {
          src: tintedDownloadImageURL,
          width: "12",
          height: "14",
          ref: this._downloadImage
        }), (0, _languageHandler._t)("Download %(text)s", {
          text: text
        }))));
      }
    } else {
      const extra = text ? ': ' + text : '';
      return /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_MFileBody"
      }, (0, _languageHandler._t)("Invalid file%(extra)s", {
        extra: extra
      }));
    }
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL21lc3NhZ2VzL01GaWxlQm9keS5qcyJdLCJuYW1lcyI6WyJ0aW50ZWREb3dubG9hZEltYWdlVVJMIiwibmV4dE1vdW50SWQiLCJtb3VudHMiLCJ1cGRhdGVUaW50ZWREb3dubG9hZEltYWdlIiwidXJpIiwicmVxdWlyZSIsImVyciIsInJlc3BvbnNlIiwiYm9keSIsInN2ZyIsIkRPTVBhcnNlciIsInBhcnNlRnJvbVN0cmluZyIsImZpeHVwcyIsIlRpbnRlciIsImNhbGNTdmdGaXh1cHMiLCJjb250ZW50RG9jdW1lbnQiLCJhcHBseVN2Z0ZpeHVwcyIsInN2Z1N0cmluZyIsIlhNTFNlcmlhbGl6ZXIiLCJzZXJpYWxpemVUb1N0cmluZyIsIndpbmRvdyIsImJ0b2EiLCJPYmplY3QiLCJrZXlzIiwiZm9yRWFjaCIsImlkIiwidGludCIsInJlZ2lzdGVyVGludGFibGUiLCJjb21wdXRlZFN0eWxlIiwiZWxlbWVudCIsInN0eWxlIiwiZ2V0Q29tcHV0ZWRTdHlsZSIsImNzc1RleHQiLCJpIiwibGVuZ3RoIiwiZ2V0UHJvcGVydHlWYWx1ZSIsImRpc3BsYXlOYW1lIiwiZ2V0SW5pdGlhbFN0YXRlIiwiZGVjcnlwdGVkQmxvYiIsInByb3BzIiwicHJvcFR5cGVzIiwibXhFdmVudCIsIlByb3BUeXBlcyIsIm9iamVjdCIsImlzUmVxdWlyZWQiLCJvbkhlaWdodENoYW5nZWQiLCJmdW5jIiwidGlsZVNoYXBlIiwic3RyaW5nIiwicHJlc2VudGFibGVUZXh0Rm9yRmlsZSIsImNvbnRlbnQiLCJsaW5rVGV4dCIsImluZm8iLCJzaXplIiwiX2dldENvbnRlbnRVcmwiLCJnZXRDb250ZW50IiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwibXhjVXJsVG9IdHRwIiwidXJsIiwiVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudCIsIl9pZnJhbWUiLCJfZHVtbXlMaW5rIiwiX2Rvd25sb2FkSW1hZ2UiLCJjb21wb25lbnREaWRNb3VudCIsImNvbXBvbmVudERpZFVwZGF0ZSIsInByZXZQcm9wcyIsInByZXZTdGF0ZSIsInN0YXRlIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJjdXJyZW50Iiwic3JjIiwiY29udGVudFdpbmRvdyIsInBvc3RNZXNzYWdlIiwiaW1nU3JjIiwicmVuZGVyIiwidGV4dCIsImlzRW5jcnlwdGVkIiwiZmlsZSIsInVuZGVmaW5lZCIsImZpbGVOYW1lIiwiY29udGVudFVybCIsIkVycm9yRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiZmlsZVNpemUiLCJmaWxlVHlwZSIsIm1pbWV0eXBlIiwiZGVjcnlwdGluZyIsImRlY3J5cHQiLCJlIiwidGhlbiIsImJsb2IiLCJzZXRTdGF0ZSIsImNhdGNoIiwiY29uc29sZSIsIndhcm4iLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZmluYWxseSIsIm9uSWZyYW1lTG9hZCIsImV2IiwidGFyZ2V0IiwiZG93bmxvYWQiLCJ0ZXh0Q29udGVudCIsImF1dG8iLCJkaXNwbGF5IiwiZW5jb2RlVVJJQ29tcG9uZW50IiwibG9jYXRpb24iLCJvcmlnaW4iLCJkb3dubG9hZFByb3BzIiwicmVsIiwiaHJlZiIsImZpbGVUb29CaWciLCJpbmNsdWRlcyIsImxvZyIsInByZXZlbnREZWZhdWx0Iiwic3RvcFByb3BhZ2F0aW9uIiwiZmV0Y2giLCJibG9iVXJsIiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIiwidGVtcEFuY2hvciIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImFwcGVuZENoaWxkIiwiY2xpY2siLCJyZW1vdmUiLCJleHRyYSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUE1QkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUErQkE7QUFDQSxJQUFJQSxzQkFBSixDLENBQ0E7QUFD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R0FBb0MsdUJBQVNILE9BQU8sQ0FBQ0UsSUFBUixDQUFhQyxJQUF0QixDQUFwQyxHQUFrRSxFQUR4RSxDQUpKLENBREosQ0FESjtBQVlILE9BYkQsTUFhTztBQUNILDRCQUNJO0FBQU0sVUFBQSxTQUFTLEVBQUM7QUFBaEIsd0JBQ0k7QUFBSyxVQUFBLFNBQVMsRUFBQztBQUFmLHdCQUNJLGtDQUFPMkQsYUFBUCxlQUNJO0FBQUssVUFBQSxHQUFHLEVBQUVoSCxzQkFBVjtBQUFrQyxVQUFBLEtBQUssRUFBQyxJQUF4QztBQUE2QyxVQUFBLE1BQU0sRUFBQyxJQUFwRDtBQUF5RCxVQUFBLEdBQUcsRUFBRSxLQUFLK0Q7QUFBbkUsVUFESixFQUVNLHlCQUFHLG1CQUFILEVBQXdCO0FBQUVhLFVBQUFBLElBQUksRUFBRUE7QUFBUixTQUF4QixDQUZOLENBREosQ0FESixDQURKO0FBVUg7QUFDSixLQXpFTSxNQXlFQTtBQUNILFlBQU1zRCxLQUFLLEdBQUd0RCxJQUFJLEdBQUksT0FBT0EsSUFBWCxHQUFtQixFQUFyQztBQUNBLDBCQUFPO0FBQU0sUUFBQSxTQUFTLEVBQUM7QUFBaEIsU0FDRCx5QkFBRyx1QkFBSCxFQUE0QjtBQUFFc0QsUUFBQUEsS0FBSyxFQUFFQTtBQUFULE9BQTVCLENBREMsQ0FBUDtBQUdIO0FBQ0o7QUFyUTJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0LCB7Y3JlYXRlUmVmfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCBmaWxlc2l6ZSBmcm9tICdmaWxlc2l6ZSc7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQge2RlY3J5cHRGaWxlfSBmcm9tICcuLi8uLi8uLi91dGlscy9EZWNyeXB0RmlsZSc7XG5pbXBvcnQgVGludGVyIGZyb20gJy4uLy4uLy4uL1RpbnRlcic7XG5pbXBvcnQgcmVxdWVzdCBmcm9tICdicm93c2VyLXJlcXVlc3QnO1xuaW1wb3J0IE1vZGFsIGZyb20gJy4uLy4uLy4uL01vZGFsJztcbmltcG9ydCBBY2Nlc3NpYmxlQnV0dG9uIGZyb20gXCIuLi9lbGVtZW50cy9BY2Nlc3NpYmxlQnV0dG9uXCI7XG5cblxuLy8gQSBjYWNoZWQgdGludGVkIGNvcHkgb2YgcmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvZG93bmxvYWQuc3ZnXCIpXG5sZXQgdGludGVkRG93bmxvYWRJbWFnZVVSTDtcbi8vIFRyYWNrIGEgbGlzdCBvZiBtb3VudGVkIE1GaWxlQm9keSBpbnN0YW5jZXMgc28gdGhhdCB3ZSBjYW4gdXBkYXRlXG4vLyB0aGUgcmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvZG93bmxvYWQuc3ZnXCIpIHdoZW4gdGhlIHRpbnQgY2hhbmdlcy5cbmxldCBuZXh0TW91bnRJZCA9IDA7XG5jb25zdCBtb3VudHMgPSB7fTtcblxuLyoqXG4gKiBVcGRhdGVzIHRoZSB0aW50ZWQgY29weSBvZiByZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9kb3dubG9hZC5zdmdcIikgd2hlbiB0aGUgdGludCBjaGFuZ2VzLlxuICovXG5mdW5jdGlvbiB1cGRhdGVUaW50ZWREb3dubG9hZEltYWdlKCkge1xuICAgIC8vIERvd25sb2FkIHRoZSBzdmcgYXMgYW4gWE1MIGRvY3VtZW50LlxuICAgIC8vIFdlIGNvdWxkIGNhY2hlIHRoZSBYTUwgcmVzcG9uc2UgaGVyZSwgYnV0IHNpbmNlIHRoZSB0aW50IHJhcmVseSBjaGFuZ2VzXG4gICAgLy8gaXQncyBwcm9iYWJseSBub3Qgd29ydGggaXQuXG4gICAgLy8gQWxzbyBub3RlIHRoYXQgd2UgY2FuJ3QgdXNlIGZldGNoIGhlcmUgYmVjYXVzZSBmZXRjaCBkb2Vzbid0IHN1cHBvcnRcbiAgICAvLyBmaWxlIFVSTHMsIHdoaWNoIHRoZSBkb3dubG9hZCBpbWFnZSB3aWxsIGJlIGlmIHdlJ3JlIHJ1bm5pbmcgZnJvbVxuICAgIC8vIHRoZSBmaWxlc3lzdGVtIChsaWtlIGluIGFuIEVsZWN0cm9uIHdyYXBwZXIpLlxuICAgIHJlcXVlc3Qoe3VyaTogcmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvZG93bmxvYWQuc3ZnXCIpfSwgKGVyciwgcmVzcG9uc2UsIGJvZHkpID0+IHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHN2ZyA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoYm9keSwgXCJpbWFnZS9zdmcreG1sXCIpO1xuICAgICAgICAvLyBBcHBseSB0aGUgZml4dXBzIHRvIHRoZSBYTUwuXG4gICAgICAgIGNvbnN0IGZpeHVwcyA9IFRpbnRlci5jYWxjU3ZnRml4dXBzKFt7Y29udGVudERvY3VtZW50OiBzdmd9XSk7XG4gICAgICAgIFRpbnRlci5hcHBseVN2Z0ZpeHVwcyhmaXh1cHMpO1xuICAgICAgICAvLyBFbmNvZGVkIHRoZSBmaXhlZCB1cCBTVkcgYXMgYSBkYXRhIFVSTC5cbiAgICAgICAgY29uc3Qgc3ZnU3RyaW5nID0gbmV3IFhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyhzdmcpO1xuICAgICAgICB0aW50ZWREb3dubG9hZEltYWdlVVJMID0gXCJkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFwiICsgd2luZG93LmJ0b2Eoc3ZnU3RyaW5nKTtcbiAgICAgICAgLy8gTm90aWZ5IGVhY2ggbW91bnRlZCBNRmlsZUJvZHkgdGhhdCB0aGUgVVJMIGhhcyBjaGFuZ2VkLlxuICAgICAgICBPYmplY3Qua2V5cyhtb3VudHMpLmZvckVhY2goZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIG1vdW50c1tpZF0udGludCgpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuVGludGVyLnJlZ2lzdGVyVGludGFibGUodXBkYXRlVGludGVkRG93bmxvYWRJbWFnZSk7XG5cbi8vIFVzZXIgc3VwcGxpZWQgY29udGVudCBjYW4gY29udGFpbiBzY3JpcHRzLCB3ZSBoYXZlIHRvIGJlIGNhcmVmdWwgdGhhdFxuLy8gd2UgZG9uJ3QgYWNjaWRlbnRhbGx5IHJ1biB0aG9zZSBzY3JpcHQgd2l0aGluIHRoZSBzYW1lIG9yaWdpbiBhcyB0aGVcbi8vIGNsaWVudC4gT3RoZXJ3aXNlIHRob3NlIHNjcmlwdHMgd3JpdHRlbiBieSByZW1vdGUgdXNlcnMgY2FuIHJlYWRcbi8vIHRoZSBhY2Nlc3MgdG9rZW4gYW5kIGVuZC10by1lbmQga2V5cyB0aGF0IGFyZSBpbiBsb2NhbCBzdG9yYWdlLlxuLy9cbi8vIEZvciBhdHRhY2htZW50cyBkb3dubG9hZGVkIGRpcmVjdGx5IGZyb20gdGhlIGhvbWVzZXJ2ZXIgd2UgY2FuIHVzZVxuLy8gQ29udGVudC1TZWN1cml0eS1Qb2xpY3kgaGVhZGVycyB0byBkaXNhYmxlIHNjcmlwdCBleGVjdXRpb24uXG4vL1xuLy8gQnV0IGF0dGFjaG1lbnRzIHdpdGggZW5kLXRvLWVuZCBlbmNyeXB0aW9uIGFyZSBtb3JlIGRpZmZpY3VsdCB0byBoYW5kbGUuXG4vLyBXZSBuZWVkIHRvIGRlY3J5cHQgdGhlIGF0dGFjaG1lbnQgb24gdGhlIGNsaWVudCBhbmQgdGhlbiBkaXNwbGF5IGl0LlxuLy8gVG8gZGlzcGxheSB0aGUgYXR0YWNobWVudCB3ZSBuZWVkIHRvIHR1cm4gdGhlIGRlY3J5cHRlZCBieXRlcyBpbnRvIGEgVVJMLlxuLy9cbi8vIFRoZXJlIGFyZSB0d28gd2F5cyB0byB0dXJuIGJ5dGVzIGludG8gVVJMcywgZGF0YSBVUkwgYW5kIGJsb2IgVVJMcy5cbi8vIERhdGEgVVJMcyBhcmVuJ3Qgc3VpdGFibGUgZm9yIGRvd25sb2FkaW5nIGEgZmlsZSBiZWNhdXNlIENocm9tZSBoYXMgYVxuLy8gMk1CIGxpbWl0IG9uIHRoZSBzaXplIG9mIFVSTHMgdGhhdCBjYW4gYmUgdmlld2VkIGluIHRoZSBicm93c2VyIG9yXG4vLyBkb3dubG9hZGVkLiBUaGlzIGxpbWl0IGRvZXMgbm90IHNlZW0gdG8gYXBwbHkgd2hlbiB0aGUgdXJsIGlzIHVzZWQgYXNcbi8vIHRoZSBzb3VyY2UgYXR0cmlidXRlIG9mIGFuIGltYWdlIHRhZy5cbi8vXG4vLyBCbG9iIFVSTHMgYXJlIGdlbmVyYXRlZCB1c2luZyB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTCBhbmQgdW5mb3J0dW5hdGVseVxuLy8gZm9yIG91ciBwdXJwb3NlcyB0aGV5IGluaGVyaXQgdGhlIG9yaWdpbiBvZiB0aGUgcGFnZSB0aGF0IGNyZWF0ZWQgdGhlbS5cbi8vIFRoaXMgbWVhbnMgdGhhdCBhbnkgc2NyaXB0cyB0aGF0IHJ1biB3aGVuIHRoZSBVUkwgaXMgdmlld2VkIHdpbGwgYmUgYWJsZVxuLy8gdG8gYWNjZXNzIGxvY2FsIHN0b3JhZ2UuXG4vL1xuLy8gVGhlIGVhc2llc3Qgc29sdXRpb24gaXMgdG8gaG9zdCB0aGUgY29kZSB0aGF0IGdlbmVyYXRlcyB0aGUgYmxvYiBVUkwgb25cbi8vIGEgZGlmZmVyZW50IGRvbWFpbiB0byB0aGUgY2xpZW50LlxuLy8gQW5vdGhlciBwb3NzaWJpbGl0eSBpcyB0byBnZW5lcmF0ZSB0aGUgYmxvYiBVUkwgd2l0aGluIGEgc2FuZGJveGVkIGlmcmFtZS5cbi8vIFRoZSBkb3duc2lkZSBvZiB1c2luZyBhIHNlY29uZCBkb21haW4gaXMgdGhhdCBpdCBjb21wbGljYXRlcyBob3N0aW5nLFxuLy8gdGhlIGRvd25zaWRlIG9mIHVzaW5nIGEgc2FuZGJveGVkIGlmcmFtZSBpcyB0aGF0IHRoZSBicm93ZXJzIGFyZSBvdmVybHlcbi8vIHJlc3RyaWN0aXZlIGluIHdoYXQgeW91IGFyZSBhbGxvd2VkIHRvIGRvIHdpdGggdGhlIGdlbmVyYXRlZCBVUkwuXG5cbi8qKlxuICogR2V0IHRoZSBjdXJyZW50IENTUyBzdHlsZSBmb3IgYSBET01FbGVtZW50LlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBnZXQgdGhlIGN1cnJlbnQgc3R5bGUgb2YuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBDU1Mgc3R5bGUgZW5jb2RlZCBhcyBhIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZWRTdHlsZShlbGVtZW50KSB7XG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICBjb25zdCBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQsIG51bGwpO1xuICAgIGxldCBjc3NUZXh0ID0gc3R5bGUuY3NzVGV4dDtcbiAgICBpZiAoY3NzVGV4dCA9PSBcIlwiKSB7XG4gICAgICAgIC8vIEZpcmVmb3ggZG9lc24ndCBpbXBsZW1lbnQgXCIuY3NzVGV4dFwiIGZvciBjb21wdXRlZCBzdHlsZXMuXG4gICAgICAgIC8vIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTEzNzY4N1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0eWxlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjc3NUZXh0ICs9IHN0eWxlW2ldICsgXCI6XCI7XG4gICAgICAgICAgICBjc3NUZXh0ICs9IHN0eWxlLmdldFByb3BlcnR5VmFsdWUoc3R5bGVbaV0pICsgXCI7XCI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNzc1RleHQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnTUZpbGVCb2R5JyxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkZWNyeXB0ZWRCbG9iOiAodGhpcy5wcm9wcy5kZWNyeXB0ZWRCbG9iID8gdGhpcy5wcm9wcy5kZWNyeXB0ZWRCbG9iIDogbnVsbCksXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICAvKiB0aGUgTWF0cml4RXZlbnQgdG8gc2hvdyAqL1xuICAgICAgICBteEV2ZW50OiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICAgIC8qIGFscmVhZHkgZGVjcnlwdGVkIGJsb2IgKi9cbiAgICAgICAgZGVjcnlwdGVkQmxvYjogUHJvcFR5cGVzLm9iamVjdCxcbiAgICAgICAgLyogY2FsbGVkIHdoZW4gdGhlIGRvd25sb2FkIGxpbmsgaWZyYW1lIGlzIHNob3duICovXG4gICAgICAgIG9uSGVpZ2h0Q2hhbmdlZDogUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgIC8qIHRoZSBzaGFwZSBvZiB0aGUgdGlsZSwgdXNlZCAqL1xuICAgICAgICB0aWxlU2hhcGU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4dHJhY3RzIGEgaHVtYW4gcmVhZGFibGUgbGFiZWwgZm9yIHRoZSBmaWxlIGF0dGFjaG1lbnQgdG8gdXNlIGFzXG4gICAgICogbGluayB0ZXh0LlxuICAgICAqXG4gICAgICogQHBhcmFtcyB7T2JqZWN0fSBjb250ZW50IFRoZSBcImNvbnRlbnRcIiBrZXkgb2YgdGhlIG1hdHJpeCBldmVudC5cbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBodW1hbiByZWFkYWJsZSBsaW5rIHRleHQgZm9yIHRoZSBhdHRhY2htZW50LlxuICAgICAqL1xuICAgIHByZXNlbnRhYmxlVGV4dEZvckZpbGU6IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgICAgICAgbGV0IGxpbmtUZXh0ID0gX3QoXCJBdHRhY2htZW50XCIpO1xuICAgICAgICBpZiAoY29udGVudC5ib2R5ICYmIGNvbnRlbnQuYm9keS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyBUaGUgY29udGVudCBib2R5IHNob3VsZCBiZSB0aGUgbmFtZSBvZiB0aGUgZmlsZSBpbmNsdWRpbmcgYVxuICAgICAgICAgICAgLy8gZmlsZSBleHRlbnNpb24uXG4gICAgICAgICAgICBsaW5rVGV4dCA9IGNvbnRlbnQuYm9keTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb250ZW50LmluZm8gJiYgY29udGVudC5pbmZvLnNpemUpIHtcbiAgICAgICAgICAgIC8vIElmIHdlIGtub3cgdGhlIHNpemUgb2YgdGhlIGZpbGUgdGhlbiBhZGQgaXQgYXMgaHVtYW4gcmVhZGFibGVcbiAgICAgICAgICAgIC8vIHN0cmluZyB0byB0aGUgZW5kIG9mIHRoZSBsaW5rIHRleHQgc28gdGhhdCB0aGUgdXNlciBrbm93cyBob3dcbiAgICAgICAgICAgIC8vIGJpZyBhIGZpbGUgdGhleSBhcmUgZG93bmxvYWRpbmcuXG4gICAgICAgICAgICAvLyBUaGUgY29udGVudC5pbmZvIGFsc28gY29udGFpbnMgYSBNSU1FLXR5cGUgYnV0IHdlIGRvbid0IGRpc3BsYXlcbiAgICAgICAgICAgIC8vIGl0IHNpbmNlIGl0IGlzIFwidWdseVwiLCB1c2VycyBnZW5lcmFsbHkgYXJlbid0IGF3YXJlIHdoYXQgaXRcbiAgICAgICAgICAgIC8vIG1lYW5zIGFuZCB0aGUgdHlwZSBvZiB0aGUgYXR0YWNobWVudCBjYW4gdXN1YWxseSBiZSBpbmZlcnJlcmVkXG4gICAgICAgICAgICAvLyBmcm9tIHRoZSBmaWxlIGV4dGVuc2lvbi5cbiAgICAgICAgICAgIGxpbmtUZXh0ICs9ICcgKCcgKyBmaWxlc2l6ZShjb250ZW50LmluZm8uc2l6ZSkgKyAnKSc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpbmtUZXh0O1xuICAgIH0sXG5cbiAgICBfZ2V0Q29udGVudFVybDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLnByb3BzLm14RXZlbnQuZ2V0Q29udGVudCgpO1xuICAgICAgICByZXR1cm4gTWF0cml4Q2xpZW50UGVnLmdldCgpLm14Y1VybFRvSHR0cChjb250ZW50LnVybCk7XG4gICAgfSxcblxuICAgIC8vIFRPRE86IFtSRUFDVC1XQVJOSU5HXSBSZXBsYWNlIGNvbXBvbmVudCB3aXRoIHJlYWwgY2xhc3MsIHVzZSBjb25zdHJ1Y3RvciBmb3IgcmVmc1xuICAgIFVOU0FGRV9jb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9pZnJhbWUgPSBjcmVhdGVSZWYoKTtcbiAgICAgICAgdGhpcy5fZHVtbXlMaW5rID0gY3JlYXRlUmVmKCk7XG4gICAgICAgIHRoaXMuX2Rvd25sb2FkSW1hZ2UgPSBjcmVhdGVSZWYoKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBBZGQgdGhpcyB0byB0aGUgbGlzdCBvZiBtb3VudGVkIGNvbXBvbmVudHMgdG8gcmVjZWl2ZSBub3RpZmljYXRpb25zXG4gICAgICAgIC8vIHdoZW4gdGhlIHRpbnQgY2hhbmdlcy5cbiAgICAgICAgdGhpcy5pZCA9IG5leHRNb3VudElkKys7XG4gICAgICAgIG1vdW50c1t0aGlzLmlkXSA9IHRoaXM7XG4gICAgICAgIHRoaXMudGludCgpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uKHByZXZQcm9wcywgcHJldlN0YXRlKSB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uSGVpZ2h0Q2hhbmdlZCAmJiAhcHJldlN0YXRlLmRlY3J5cHRlZEJsb2IgJiYgdGhpcy5zdGF0ZS5kZWNyeXB0ZWRCbG9iKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uSGVpZ2h0Q2hhbmdlZCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gUmVtb3ZlIHRoaXMgZnJvbSB0aGUgbGlzdCBvZiBtb3VudGVkIGNvbXBvbmVudHNcbiAgICAgICAgZGVsZXRlIG1vdW50c1t0aGlzLmlkXTtcbiAgICB9LFxuXG4gICAgdGludDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFVwZGF0ZSBvdXIgdGludGVkIGNvcHkgb2YgcmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvZG93bmxvYWQuc3ZnXCIpXG4gICAgICAgIGlmICh0aGlzLl9kb3dubG9hZEltYWdlLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX2Rvd25sb2FkSW1hZ2UuY3VycmVudC5zcmMgPSB0aW50ZWREb3dubG9hZEltYWdlVVJMO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9pZnJhbWUuY3VycmVudCkge1xuICAgICAgICAgICAgLy8gSWYgdGhlIGF0dGFjaG1lbnQgaXMgZW5jcnlwdGVkIHRoZW4gdGhlIGRvd25sb2FkIGltYWdlXG4gICAgICAgICAgICAvLyB3aWxsIGJlIGluc2lkZSB0aGUgaWZyYW1lIHNvIHdlIHdvbnQgYmUgYWJsZSB0byB1cGRhdGVcbiAgICAgICAgICAgIC8vIGl0IGRpcmVjdGx5LlxuICAgICAgICAgICAgdGhpcy5faWZyYW1lLmN1cnJlbnQuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgaW1nU3JjOiB0aW50ZWREb3dubG9hZEltYWdlVVJMLFxuICAgICAgICAgICAgICAgIHN0eWxlOiBjb21wdXRlZFN0eWxlKHRoaXMuX2R1bW15TGluay5jdXJyZW50KSxcbiAgICAgICAgICAgIH0sIFwiKlwiKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gdGhpcy5wcm9wcy5teEV2ZW50LmdldENvbnRlbnQoKTtcbiAgICAgICAgY29uc3QgdGV4dCA9IHRoaXMucHJlc2VudGFibGVUZXh0Rm9yRmlsZShjb250ZW50KTtcbiAgICAgICAgY29uc3QgaXNFbmNyeXB0ZWQgPSBjb250ZW50LmZpbGUgIT09IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBjb250ZW50LmJvZHkgJiYgY29udGVudC5ib2R5Lmxlbmd0aCA+IDAgPyBjb250ZW50LmJvZHkgOiBfdChcIkF0dGFjaG1lbnRcIik7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRVcmwgPSB0aGlzLl9nZXRDb250ZW50VXJsKCk7XG4gICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG4gICAgICAgIGNvbnN0IGZpbGVTaXplID0gY29udGVudC5pbmZvID8gY29udGVudC5pbmZvLnNpemUgOiBudWxsO1xuICAgICAgICBjb25zdCBmaWxlVHlwZSA9IGNvbnRlbnQuaW5mbyA/IGNvbnRlbnQuaW5mby5taW1ldHlwZSA6IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCI7XG5cbiAgICAgICAgaWYgKGlzRW5jcnlwdGVkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5kZWNyeXB0ZWRCbG9iID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgLy8gTmVlZCB0byBkZWNyeXB0IHRoZSBhdHRhY2htZW50XG4gICAgICAgICAgICAgICAgLy8gV2FpdCBmb3IgdGhlIHVzZXIgdG8gY2xpY2sgb24gdGhlIGxpbmsgYmVmb3JlIGRvd25sb2FkaW5nXG4gICAgICAgICAgICAgICAgLy8gYW5kIGRlY3J5cHRpbmcgdGhlIGF0dGFjaG1lbnQuXG4gICAgICAgICAgICAgICAgbGV0IGRlY3J5cHRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBjb25zdCBkZWNyeXB0ID0gKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlY3J5cHRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkZWNyeXB0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZGVjcnlwdEZpbGUoY29udGVudC5maWxlKS50aGVuKChibG9iKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWNyeXB0ZWRCbG9iOiBibG9iLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIlVuYWJsZSB0byBkZWNyeXB0IGF0dGFjaG1lbnQ6IFwiLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRXJyb3IgZGVjcnlwdGluZyBhdHRhY2htZW50JywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiRXJyb3JcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFwiRXJyb3IgZGVjcnlwdGluZyBhdHRhY2htZW50XCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVjcnlwdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBidXR0b24gc2hvdWxkIGFjdHVhbGx5IERvd25sb2FkIGJlY2F1c2UgdXNlcmNvbnRlbnQvIHdpbGwgdHJ5IHRvIGNsaWNrIGl0c2VsZlxuICAgICAgICAgICAgICAgIC8vIGJ1dCBpdCBpcyBub3QgZ3VhcmFudGVlZCBiZXR3ZWVuIHZhcmlvdXMgYnJvd3NlcnMnIHNldHRpbmdzLlxuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X01GaWxlQm9keVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9NRmlsZUJvZHlfZG93bmxvYWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXtkZWNyeXB0fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBfdChcIkRlY3J5cHQgJSh0ZXh0KXNcIiwgeyB0ZXh0OiB0ZXh0IH0pIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFdoZW4gdGhlIGlmcmFtZSBsb2FkcyB3ZSB0ZWxsIGl0IHRvIHJlbmRlciBhIGRvd25sb2FkIGxpbmtcbiAgICAgICAgICAgIGNvbnN0IG9uSWZyYW1lTG9hZCA9IChldikgPT4ge1xuICAgICAgICAgICAgICAgIGV2LnRhcmdldC5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgaW1nU3JjOiB0aW50ZWREb3dubG9hZEltYWdlVVJMLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZTogY29tcHV0ZWRTdHlsZSh0aGlzLl9kdW1teUxpbmsuY3VycmVudCksXG4gICAgICAgICAgICAgICAgICAgIGJsb2I6IHRoaXMuc3RhdGUuZGVjcnlwdGVkQmxvYixcbiAgICAgICAgICAgICAgICAgICAgLy8gU2V0IGEgZG93bmxvYWQgYXR0cmlidXRlIGZvciBlbmNyeXB0ZWQgZmlsZXMgc28gdGhhdCB0aGUgZmlsZVxuICAgICAgICAgICAgICAgICAgICAvLyB3aWxsIGhhdmUgdGhlIGNvcnJlY3QgbmFtZSB3aGVuIHRoZSB1c2VyIHRyaWVzIHRvIGRvd25sb2FkIGl0LlxuICAgICAgICAgICAgICAgICAgICAvLyBXZSBjYW4ndCBwcm92aWRlIGEgQ29udGVudC1EaXNwb3NpdGlvbiBoZWFkZXIgbGlrZSB3ZSB3b3VsZCBmb3IgSFRUUC5cbiAgICAgICAgICAgICAgICAgICAgZG93bmxvYWQ6IGZpbGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0Q29udGVudDogX3QoXCJEb3dubG9hZCAlKHRleHQpc1wiLCB7IHRleHQ6IHRleHQgfSksXG4gICAgICAgICAgICAgICAgICAgIC8vIG9ubHkgYXV0by1kb3dubG9hZCBpZiBhIHVzZXIgdHJpZ2dlcmVkIHRoaXMgaWZyYW1lIGV4cGxpY2l0bHlcbiAgICAgICAgICAgICAgICAgICAgYXV0bzogIXRoaXMucHJvcHMuZGVjcnlwdGVkQmxvYixcbiAgICAgICAgICAgICAgICB9LCBcIipcIik7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjb25zdCB1cmwgPSBcInVzZXJjb250ZW50L1wiOyAvLyBYWFg6IHRoaXMgcGF0aCBzaG91bGQgcHJvYmFibHkgYmUgcGFzc2VkIGZyb20gdGhlIHNraW5cblxuICAgICAgICAgICAgLy8gSWYgdGhlIGF0dGFjaG1lbnQgaXMgZW5jcnlwdGVkIHRoZW4gcHV0IHRoZSBsaW5rIGluc2lkZSBhbiBpZnJhbWUuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X01GaWxlQm9keVwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X01GaWxlQm9keV9kb3dubG9hZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17e2Rpc3BsYXk6IFwibm9uZVwifX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBBZGQgZHVtbXkgY29weSBvZiB0aGUgXCJhXCIgdGFnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFdlJ2xsIHVzZSBpdCB0byBsZWFybiBob3cgdGhlIGRvd25sb2FkIGxpbmtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogd291bGQgaGF2ZSBiZWVuIHN0eWxlZCBpZiBpdCB3YXMgcmVuZGVyZWQgaW5saW5lLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIHJlZj17dGhpcy5fZHVtbXlMaW5rfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aWZyYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjPXtgJHt1cmx9P29yaWdpbj0ke2VuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24ub3JpZ2luKX1gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uTG9hZD17b25JZnJhbWVMb2FkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZj17dGhpcy5faWZyYW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhbmRib3g9XCJhbGxvdy1zY3JpcHRzIGFsbG93LWRvd25sb2FkcyBhbGxvdy1kb3dubG9hZHMtd2l0aG91dC11c2VyLWFjdGl2YXRpb25cIiAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKGNvbnRlbnRVcmwpIHtcbiAgICAgICAgICAgIGNvbnN0IGRvd25sb2FkUHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBcIl9ibGFua1wiLFxuICAgICAgICAgICAgICAgIHJlbDogXCJub3JlZmVycmVyIG5vb3BlbmVyXCIsXG5cbiAgICAgICAgICAgICAgICAvLyBXZSBzZXQgdGhlIGhyZWYgcmVnYXJkbGVzcyBvZiB3aGV0aGVyIG9yIG5vdCB3ZSBpbnRlcmNlcHQgdGhlIGRvd25sb2FkXG4gICAgICAgICAgICAgICAgLy8gYmVjYXVzZSB3ZSBkb24ndCByZWFsbHkgd2FudCB0byBjb252ZXJ0IHRoZSBmaWxlIHRvIGEgYmxvYiBlYWdlcmx5LCBhbmRcbiAgICAgICAgICAgICAgICAvLyBzdGlsbCB3YW50IFwib3BlbiBpbiBuZXcgdGFiXCIgYW5kIFwic2F2ZSBsaW5rIGFzXCIgdG8gd29yay5cbiAgICAgICAgICAgICAgICBocmVmOiBjb250ZW50VXJsLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gQmxvYnMgY2FuIG9ubHkgaGF2ZSB1cCB0byA1MDBtYiwgc28gaWYgdGhlIGZpbGUgcmVwb3J0cyBhcyBiZWluZyB0b28gbGFyZ2UgdGhlblxuICAgICAgICAgICAgLy8gd2Ugd29uJ3QgdHJ5IGFuZCBjb252ZXJ0IGl0LiBMaWtld2lzZSwgaWYgdGhlIGZpbGUgc2l6ZSBpcyB1bmtub3duIHRoZW4gd2UnbGwgYXNzdW1lXG4gICAgICAgICAgICAvLyBpdCBpcyB0b28gYmlnLiBUaGVyZSBpcyB0aGUgcmlzayBvZiB0aGUgcmVwb3J0ZWQgZmlsZSBzaXplIGFuZCB0aGUgYWN0dWFsIGZpbGUgc2l6ZVxuICAgICAgICAgICAgLy8gYmVpbmcgZGlmZmVyZW50LCBob3dldmVyIHRoZSB1c2VyIHNob3VsZG4ndCBub3JtYWxseSBydW4gaW50byB0aGlzIHByb2JsZW0uXG4gICAgICAgICAgICBjb25zdCBmaWxlVG9vQmlnID0gdHlwZW9mKGZpbGVTaXplKSA9PT0gJ251bWJlcicgPyBmaWxlU2l6ZSA+IDUyNDI4ODAwMCA6IHRydWU7XG5cbiAgICAgICAgICAgIGlmIChbXCJhcHBsaWNhdGlvbi9wZGZcIl0uaW5jbHVkZXMoZmlsZVR5cGUpICYmICFmaWxlVG9vQmlnKSB7XG4gICAgICAgICAgICAgICAgLy8gV2Ugd2FudCB0byBmb3JjZSBhIGRvd25sb2FkIG9uIHRoaXMgdHlwZSwgc28gdXNlIGFuIG9uQ2xpY2sgaGFuZGxlci5cbiAgICAgICAgICAgICAgICBkb3dubG9hZFByb3BzW1wib25DbGlja1wiXSA9IChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBEb3dubG9hZGluZyAke2ZpbGVUeXBlfSBhcyBibG9iICh1bmVuY3J5cHRlZClgKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBBdm9pZCBsZXR0aW5nIHRoZSA8YT4gZG8gaXRzIHRoaW5nXG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBTdGFydCBhIGZldGNoIGZvciB0aGUgZG93bmxvYWRcbiAgICAgICAgICAgICAgICAgICAgLy8gQmFzZWQgdXBvbiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNDk1MDA0NjVcbiAgICAgICAgICAgICAgICAgICAgZmV0Y2goY29udGVudFVybCkudGhlbigocmVzcG9uc2UpID0+IHJlc3BvbnNlLmJsb2IoKSkudGhlbigoYmxvYikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYmxvYlVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIGhhdmUgdG8gY3JlYXRlIGFuIGFuY2hvciB0byBkb3dubG9hZCB0aGUgZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGVtcEFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBBbmNob3IuZG93bmxvYWQgPSBmaWxlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBBbmNob3IuaHJlZiA9IGJsb2JVcmw7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRlbXBBbmNob3IpOyAvLyBmb3IgZmlyZWZveDogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzMyMjI2MDY4XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wQW5jaG9yLmNsaWNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wQW5jaG9yLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBFbHNlIHdlIGFyZSBob3BpbmcgdGhlIGJyb3dzZXIgd2lsbCBkbyB0aGUgcmlnaHQgdGhpbmdcbiAgICAgICAgICAgICAgICBkb3dubG9hZFByb3BzW1wiZG93bmxvYWRcIl0gPSBmaWxlTmFtZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWYgdGhlIGF0dGFjaG1lbnQgaXMgbm90IGVuY3J5cHRlZCB0aGVuIHdlIGNoZWNrIHdoZXRoZXIgd2VcbiAgICAgICAgICAgIC8vIGFyZSBiZWluZyBkaXNwbGF5ZWQgaW4gdGhlIHJvb20gdGltZWxpbmUgb3IgaW4gYSBsaXN0IG9mXG4gICAgICAgICAgICAvLyBmaWxlcyBpbiB0aGUgcmlnaHQgaGFuZCBzaWRlIG9mIHRoZSBzY3JlZW4uXG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wcy50aWxlU2hhcGUgPT09IFwiZmlsZV9ncmlkXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9NRmlsZUJvZHlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTUZpbGVCb2R5X2Rvd25sb2FkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwibXhfTUZpbGVCb2R5X2Rvd25sb2FkTGlua1wiIHsuLi5kb3dubG9hZFByb3BzfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBmaWxlTmFtZSB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTUltYWdlQm9keV9zaXplXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgY29udGVudC5pbmZvICYmIGNvbnRlbnQuaW5mby5zaXplID8gZmlsZXNpemUoY29udGVudC5pbmZvLnNpemUpIDogXCJcIiB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X01GaWxlQm9keVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9NRmlsZUJvZHlfZG93bmxvYWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSB7Li4uZG93bmxvYWRQcm9wc30+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXt0aW50ZWREb3dubG9hZEltYWdlVVJMfSB3aWR0aD1cIjEyXCIgaGVpZ2h0PVwiMTRcIiByZWY9e3RoaXMuX2Rvd25sb2FkSW1hZ2V9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgX3QoXCJEb3dubG9hZCAlKHRleHQpc1wiLCB7IHRleHQ6IHRleHQgfSkgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGV4dHJhID0gdGV4dCA/ICgnOiAnICsgdGV4dCkgOiAnJztcbiAgICAgICAgICAgIHJldHVybiA8c3BhbiBjbGFzc05hbWU9XCJteF9NRmlsZUJvZHlcIj5cbiAgICAgICAgICAgICAgICB7IF90KFwiSW52YWxpZCBmaWxlJShleHRyYSlzXCIsIHsgZXh0cmE6IGV4dHJhIH0pIH1cbiAgICAgICAgICAgIDwvc3Bhbj47XG4gICAgICAgIH1cbiAgICB9LFxufSk7XG4iXX0=