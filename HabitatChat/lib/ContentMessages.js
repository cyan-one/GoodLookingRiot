/*
Copyright 2015, 2016 OpenMarket Ltd
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

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.UploadCanceledError = void 0;

var _extend = _interopRequireDefault(require("./extend"));

var _dispatcher = _interopRequireDefault(require("./dispatcher/dispatcher"));

var _MatrixClientPeg = require("./MatrixClientPeg");

var sdk = _interopRequireWildcard(require("./index"));

var _languageHandler = require("./languageHandler");

var _Modal = _interopRequireDefault(require("./Modal"));

var _RoomViewStore = _interopRequireDefault(require("./stores/RoomViewStore"));

var _browserEncryptAttachment = _interopRequireDefault(require("browser-encrypt-attachment"));

var _pngChunksExtract = _interopRequireDefault(require("png-chunks-extract"));

require("blueimp-canvas-to-blob");

// Polyfill for Canvas.toBlob API using Canvas.toDataURL
const MAX_WIDTH = 800;
const MAX_HEIGHT = 600; // scraped out of a macOS hidpi (5660ppm) screenshot png
//                  5669 px (x-axis)      , 5669 px (y-axis)      , per metre

const PHYS_HIDPI = [0x00, 0x00, 0x16, 0x25, 0x00, 0x00, 0x16, 0x25, 0x01];

class UploadCanceledError extends Error {}
/**
 * Create a thumbnail for a image DOM element.
 * The image will be smaller than MAX_WIDTH and MAX_HEIGHT.
 * The thumbnail will have the same aspect ratio as the original.
 * Draws the element into a canvas using CanvasRenderingContext2D.drawImage
 * Then calls Canvas.toBlob to get a blob object for the image data.
 *
 * Since it needs to calculate the dimensions of the source image and the
 * thumbnailed image it returns an info object filled out with information
 * about the original image and the thumbnail.
 *
 * @param {HTMLElement} element The element to thumbnail.
 * @param {integer} inputWidth The width of the image in the input element.
 * @param {integer} inputHeight the width of the image in the input element.
 * @param {String} mimeType The mimeType to save the blob as.
 * @return {Promise} A promise that resolves with an object with an info key
 *  and a thumbnail key.
 */


exports.UploadCanceledError = UploadCanceledError;

function createThumbnail(element, inputWidth, inputHeight, mimeType) {
  return new Promise(resolve => {
    let targetWidth = inputWidth;
    let targetHeight = inputHeight;

    if (targetHeight > MAX_HEIGHT) {
      targetWidth = Math.floor(targetWidth * (MAX_HEIGHT / targetHeight));
      targetHeight = MAX_HEIGHT;
    }

    if (targetWidth > MAX_WIDTH) {
      targetHeight = Math.floor(targetHeight * (MAX_WIDTH / targetWidth));
      targetWidth = MAX_WIDTH;
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.getContext("2d").drawImage(element, 0, 0, targetWidth, targetHeight);
    canvas.toBlob(function (thumbnail) {
      resolve({
        info: {
          thumbnail_info: {
            w: targetWidth,
            h: targetHeight,
            mimetype: thumbnail.type,
            size: thumbnail.size
          },
          w: inputWidth,
          h: inputHeight
        },
        thumbnail: thumbnail
      });
    }, mimeType);
  });
}
/**
 * Load a file into a newly created image element.
 *
 * @param {File} imageFile The file to load in an image element.
 * @return {Promise} A promise that resolves with the html image element.
 */


async function loadImageElement(imageFile) {
  // Load the file into an html element
  const img = document.createElement("img");
  const objectUrl = URL.createObjectURL(imageFile);
  const imgPromise = new Promise((resolve, reject) => {
    img.onload = function () {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = function (e) {
      reject(e);
    };
  });
  img.src = objectUrl; // check for hi-dpi PNGs and fudge display resolution as needed.
  // this is mainly needed for macOS screencaps

  let parsePromise;

  if (imageFile.type === "image/png") {
    // in practice macOS happens to order the chunks so they fall in
    // the first 0x1000 bytes (thanks to a massive ICC header).
    // Thus we could slice the file down to only sniff the first 0x1000
    // bytes (but this makes extractPngChunks choke on the corrupt file)
    const headers = imageFile; //.slice(0, 0x1000);

    parsePromise = readFileAsArrayBuffer(headers).then(arrayBuffer => {
      const buffer = new Uint8Array(arrayBuffer);
      const chunks = (0, _pngChunksExtract.default)(buffer);

      for (const chunk of chunks) {
        if (chunk.name === 'pHYs') {
          if (chunk.data.byteLength !== PHYS_HIDPI.length) return;
          const hidpi = chunk.data.every((val, i) => val === PHYS_HIDPI[i]);
          return hidpi;
        }
      }

      return false;
    });
  }

  const [hidpi] = await Promise.all([parsePromise, imgPromise]);
  const width = hidpi ? img.width >> 1 : img.width;
  const height = hidpi ? img.height >> 1 : img.height;
  return {
    width,
    height,
    img
  };
}
/**
 * Read the metadata for an image file and create and upload a thumbnail of the image.
 *
 * @param {MatrixClient} matrixClient A matrixClient to upload the thumbnail with.
 * @param {String} roomId The ID of the room the image will be uploaded in.
 * @param {File} imageFile The image to read and thumbnail.
 * @return {Promise} A promise that resolves with the attachment info.
 */


function infoForImageFile(matrixClient, roomId, imageFile) {
  let thumbnailType = "image/png";

  if (imageFile.type == "image/jpeg") {
    thumbnailType = "image/jpeg";
  }

  let imageInfo;
  return loadImageElement(imageFile).then(function (r) {
    return createThumbnail(r.img, r.width, r.height, thumbnailType);
  }).then(function (result) {
    imageInfo = result.info;
    return uploadFile(matrixClient, roomId, result.thumbnail);
  }).then(function (result) {
    imageInfo.thumbnail_url = result.url;
    imageInfo.thumbnail_file = result.file;
    return imageInfo;
  });
}
/**
 * Load a file into a newly created video element.
 *
 * @param {File} videoFile The file to load in an video element.
 * @return {Promise} A promise that resolves with the video image element.
 */


function loadVideoElement(videoFile) {
  return new Promise((resolve, reject) => {
    // Load the file into an html element
    const video = document.createElement("video");
    const reader = new FileReader();

    reader.onload = function (e) {
      video.src = e.target.result; // Once ready, returns its size
      // Wait until we have enough data to thumbnail the first frame.

      video.onloadeddata = function () {
        resolve(video);
      };

      video.onerror = function (e) {
        reject(e);
      };
    };

    reader.onerror = function (e) {
      reject(e);
    };

    reader.readAsDataURL(videoFile);
  });
}
/**
 * Read the metadata for a video file and create and upload a thumbnail of the video.
 *
 * @param {MatrixClient} matrixClient A matrixClient to upload the thumbnail with.
 * @param {String} roomId The ID of the room the video will be uploaded to.
 * @param {File} videoFile The video to read and thumbnail.
 * @return {Promise} A promise that resolves with the attachment info.
 */


function infoForVideoFile(matrixClient, roomId, videoFile) {
  const thumbnailType = "image/jpeg";
  let videoInfo;
  return loadVideoElement(videoFile).then(function (video) {
    return createThumbnail(video, video.videoWidth, video.videoHeight, thumbnailType);
  }).then(function (result) {
    videoInfo = result.info;
    return uploadFile(matrixClient, roomId, result.thumbnail);
  }).then(function (result) {
    videoInfo.thumbnail_url = result.url;
    videoInfo.thumbnail_file = result.file;
    return videoInfo;
  });
}
/**
 * Read the file as an ArrayBuffer.
 * @param {File} file The file to read
 * @return {Promise} A promise that resolves with an ArrayBuffer when the file
 *   is read.
 */


function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      resolve(e.target.result);
    };

    reader.onerror = function (e) {
      reject(e);
    };

    reader.readAsArrayBuffer(file);
  });
}
/**
 * Upload the file to the content repository.
 * If the room is encrypted then encrypt the file before uploading.
 *
 * @param {MatrixClient} matrixClient The matrix client to upload the file with.
 * @param {String} roomId The ID of the room being uploaded to.
 * @param {File} file The file to upload.
 * @param {Function?} progressHandler optional callback to be called when a chunk of
 *    data is uploaded.
 * @return {Promise} A promise that resolves with an object.
 *  If the file is unencrypted then the object will have a "url" key.
 *  If the file is encrypted then the object will have a "file" key.
 */


function uploadFile(matrixClient, roomId, file, progressHandler) {
  if (matrixClient.isRoomEncrypted(roomId)) {
    // If the room is encrypted then encrypt the file before uploading it.
    // First read the file into memory.
    let canceled = false;
    let uploadPromise;
    let encryptInfo;
    const prom = readFileAsArrayBuffer(file).then(function (data) {
      if (canceled) throw new UploadCanceledError(); // Then encrypt the file.

      return _browserEncryptAttachment.default.encryptAttachment(data);
    }).then(function (encryptResult) {
      if (canceled) throw new UploadCanceledError(); // Record the information needed to decrypt the attachment.

      encryptInfo = encryptResult.info; // Pass the encrypted data as a Blob to the uploader.

      const blob = new Blob([encryptResult.data]);
      uploadPromise = matrixClient.uploadContent(blob, {
        progressHandler: progressHandler,
        includeFilename: false
      });
      return uploadPromise;
    }).then(function (url) {
      // If the attachment is encrypted then bundle the URL along
      // with the information needed to decrypt the attachment and
      // add it under a file key.
      encryptInfo.url = url;

      if (file.type) {
        encryptInfo.mimetype = file.type;
      }

      return {
        "file": encryptInfo
      };
    });

    prom.abort = () => {
      canceled = true;
      if (uploadPromise) _MatrixClientPeg.MatrixClientPeg.get().cancelUpload(uploadPromise);
    };

    return prom;
  } else {
    const basePromise = matrixClient.uploadContent(file, {
      progressHandler: progressHandler
    });
    const promise1 = basePromise.then(function (url) {
      // If the attachment isn't encrypted then include the URL directly.
      return {
        "url": url
      };
    }); // XXX: copy over the abort method to the new promise

    promise1.abort = basePromise.abort;
    return promise1;
  }
}

class ContentMessages {
  constructor() {
    this.inprogress = [];
    this.nextId = 0;
    this._mediaConfig = null;
  }

  static sharedInstance() {
    if (global.mx_ContentMessages === undefined) {
      global.mx_ContentMessages = new ContentMessages();
    }

    return global.mx_ContentMessages;
  }

  _isFileSizeAcceptable(file) {
    if (this._mediaConfig !== null && this._mediaConfig["m.upload.size"] !== undefined && file.size > this._mediaConfig["m.upload.size"]) {
      return false;
    }

    return true;
  }

  _ensureMediaConfigFetched() {
    if (this._mediaConfig !== null) return;
    console.log("[Media Config] Fetching");
    return _MatrixClientPeg.MatrixClientPeg.get().getMediaConfig().then(config => {
      console.log("[Media Config] Fetched config:", config);
      return config;
    }).catch(() => {
      // Media repo can't or won't report limits, so provide an empty object (no limits).
      console.log("[Media Config] Could not fetch config, so not limiting uploads.");
      return {};
    }).then(config => {
      this._mediaConfig = config;
    });
  }

  sendStickerContentToRoom(url, roomId, info, text, matrixClient) {
    return _MatrixClientPeg.MatrixClientPeg.get().sendStickerMessage(roomId, url, info, text).catch(e => {
      console.warn("Failed to send content with URL ".concat(url, " to room ").concat(roomId), e);
      throw e;
    });
  }

  getUploadLimit() {
    if (this._mediaConfig !== null && this._mediaConfig["m.upload.size"] !== undefined) {
      return this._mediaConfig["m.upload.size"];
    } else {
      return null;
    }
  }

  async sendContentListToRoom(files, roomId, matrixClient) {
    if (matrixClient.isGuest()) {
      _dispatcher.default.dispatch({
        action: 'require_registration'
      });

      return;
    }

    const isQuoting = Boolean(_RoomViewStore.default.getQuotingEvent());

    if (isQuoting) {
      const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");
      const shouldUpload = await new Promise(resolve => {
        _Modal.default.createTrackedDialog('Upload Reply Warning', '', QuestionDialog, {
          title: (0, _languageHandler._t)('Replying With Files'),
          description: /*#__PURE__*/React.createElement("div", null, (0, _languageHandler._t)('At this time it is not possible to reply with a file. ' + 'Would you like to upload this file without replying?')),
          hasCancelButton: true,
          button: (0, _languageHandler._t)("Continue"),
          onFinished: shouldUpload => {
            resolve(shouldUpload);
          }
        });
      });
      if (!shouldUpload) return;
    }

    await this._ensureMediaConfigFetched();
    const tooBigFiles = [];
    const okFiles = [];

    for (let i = 0; i < files.length; ++i) {
      if (this._isFileSizeAcceptable(files[i])) {
        okFiles.push(files[i]);
      } else {
        tooBigFiles.push(files[i]);
      }
    }

    if (tooBigFiles.length > 0) {
      const UploadFailureDialog = sdk.getComponent("dialogs.UploadFailureDialog");
      const uploadFailureDialogPromise = new Promise(resolve => {
        _Modal.default.createTrackedDialog('Upload Failure', '', UploadFailureDialog, {
          badFiles: tooBigFiles,
          totalFiles: files.length,
          contentMessages: this,
          onFinished: shouldContinue => {
            resolve(shouldContinue);
          }
        });
      });
      const shouldContinue = await uploadFailureDialogPromise;
      if (!shouldContinue) return;
    }

    const UploadConfirmDialog = sdk.getComponent("dialogs.UploadConfirmDialog");
    let uploadAll = false; // Promise to complete before sending next file into room, used for synchronisation of file-sending
    // to match the order the files were specified in

    let promBefore = Promise.resolve();

    for (let i = 0; i < okFiles.length; ++i) {
      const file = okFiles[i];

      if (!uploadAll) {
        const shouldContinue = await new Promise(resolve => {
          _Modal.default.createTrackedDialog('Upload Files confirmation', '', UploadConfirmDialog, {
            file,
            currentIndex: i,
            totalFiles: okFiles.length,
            onFinished: (shouldContinue, shouldUploadAll) => {
              if (shouldUploadAll) {
                uploadAll = true;
              }

              resolve(shouldContinue);
            }
          });
        });
        if (!shouldContinue) break;
      }

      promBefore = this._sendContentToRoom(file, roomId, matrixClient, promBefore);
    }
  }

  _sendContentToRoom(file, roomId, matrixClient, promBefore) {
    const content = {
      body: file.name || 'Attachment',
      info: {
        size: file.size
      }
    }; // if we have a mime type for the file, add it to the message metadata

    if (file.type) {
      content.info.mimetype = file.type;
    }

    const prom = new Promise(resolve => {
      if (file.type.indexOf('image/') == 0) {
        content.msgtype = 'm.image';
        infoForImageFile(matrixClient, roomId, file).then(imageInfo => {
          (0, _extend.default)(content.info, imageInfo);
          resolve();
        }, error => {
          console.error(error);
          content.msgtype = 'm.file';
          resolve();
        });
      } else if (file.type.indexOf('audio/') == 0) {
        content.msgtype = 'm.audio';
        resolve();
      } else if (file.type.indexOf('video/') == 0) {
        content.msgtype = 'm.video';
        infoForVideoFile(matrixClient, roomId, file).then(videoInfo => {
          (0, _extend.default)(content.info, videoInfo);
          resolve();
        }, error => {
          content.msgtype = 'm.file';
          resolve();
        });
      } else {
        content.msgtype = 'm.file';
        resolve();
      }
    });
    const upload = {
      fileName: file.name || 'Attachment',
      roomId: roomId,
      total: 0,
      loaded: 0
    };
    this.inprogress.push(upload);

    _dispatcher.default.dispatch({
      action: 'upload_started'
    }); // Focus the composer view


    _dispatcher.default.dispatch({
      action: 'focus_composer'
    });

    let error;

    function onProgress(ev) {
      upload.total = ev.total;
      upload.loaded = ev.loaded;

      _dispatcher.default.dispatch({
        action: 'upload_progress',
        upload: upload
      });
    }

    return prom.then(function () {
      // XXX: upload.promise must be the promise that
      // is returned by uploadFile as it has an abort()
      // method hacked onto it.
      upload.promise = uploadFile(matrixClient, roomId, file, onProgress);
      return upload.promise.then(function (result) {
        content.file = result.file;
        content.url = result.url;
      });
    }).then(url => {
      // Await previous message being sent into the room
      return promBefore;
    }).then(function () {
      return matrixClient.sendMessage(roomId, content);
    }, function (err) {
      error = err;

      if (!upload.canceled) {
        let desc = (0, _languageHandler._t)("The file '%(fileName)s' failed to upload.", {
          fileName: upload.fileName
        });

        if (err.http_status == 413) {
          desc = (0, _languageHandler._t)("The file '%(fileName)s' exceeds this homeserver's size limit for uploads", {
            fileName: upload.fileName
          });
        }

        const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

        _Modal.default.createTrackedDialog('Upload failed', '', ErrorDialog, {
          title: (0, _languageHandler._t)('Upload Failed'),
          description: desc
        });
      }
    }).finally(() => {
      const inprogressKeys = Object.keys(this.inprogress);

      for (let i = 0; i < this.inprogress.length; ++i) {
        const k = inprogressKeys[i];

        if (this.inprogress[k].promise === upload.promise) {
          this.inprogress.splice(k, 1);
          break;
        }
      }

      if (error) {
        // 413: File was too big or upset the server in some way:
        // clear the media size limit so we fetch it again next time
        // we try to upload
        if (error && error.http_status === 413) {
          this._mediaConfig = null;
        }

        _dispatcher.default.dispatch({
          action: 'upload_failed',
          upload,
          error
        });
      } else {
        _dispatcher.default.dispatch({
          action: 'upload_finished',
          upload
        });

        _dispatcher.default.dispatch({
          action: 'message_sent'
        });
      }
    });
  }

  getCurrentUploads() {
    return this.inprogress.filter(u => !u.canceled);
  }

  cancelUpload(promise) {
    const inprogressKeys = Object.keys(this.inprogress);
    let upload;

    for (let i = 0; i < this.inprogress.length; ++i) {
      const k = inprogressKeys[i];

      if (this.inprogress[k].promise === promise) {
        upload = this.inprogress[k];
        break;
      }
    }

    if (upload) {
      upload.canceled = true;

      _MatrixClientPeg.MatrixClientPeg.get().cancelUpload(upload.promise);

      _dispatcher.default.dispatch({
        action: 'upload_canceled',
        upload
      });
    }
  }

}

exports.default = ContentMessages;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Db250ZW50TWVzc2FnZXMuanMiXSwibmFtZXMiOlsiTUFYX1dJRFRIIiwiTUFYX0hFSUdIVCIsIlBIWVNfSElEUEkiLCJVcGxvYWRDYW5jZWxlZEVycm9yIiwiRXJyb3IiLCJjcmVhdGVUaHVtYm5haWwiLCJlbGVtZW50IiwiaW5wdXRXaWR0aCIsImlucHV0SGVpZ2h0IiwibWltZVR5cGUiLCJQcm9taXNlIiwicmVzb2x2ZSIsInRhcmdldFdpZHRoIiwidGFyZ2V0SGVpZ2h0IiwiTWF0aCIsImZsb29yIiwiY2FudmFzIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50Iiwid2lkdGgiLCJoZWlnaHQiLCJnZXRDb250ZXh0IiwiZHJhd0ltYWdlIiwidG9CbG9iIiwidGh1bWJuYWlsIiwiaW5mbyIsInRodW1ibmFpbF9pbmZvIiwidyIsImgiLCJtaW1ldHlwZSIsInR5cGUiLCJzaXplIiwibG9hZEltYWdlRWxlbWVudCIsImltYWdlRmlsZSIsImltZyIsIm9iamVjdFVybCIsIlVSTCIsImNyZWF0ZU9iamVjdFVSTCIsImltZ1Byb21pc2UiLCJyZWplY3QiLCJvbmxvYWQiLCJyZXZva2VPYmplY3RVUkwiLCJvbmVycm9yIiwiZSIsInNyYyIsInBhcnNlUHJvbWlzZSIsImhlYWRlcnMiLCJyZWFkRmlsZUFzQXJyYXlCdWZmZXIiLCJ0aGVuIiwiYXJyYXlCdWZmZXIiLCJidWZmZXIiLCJVaW50OEFycmF5IiwiY2h1bmtzIiwiY2h1bmsiLCJuYW1lIiwiZGF0YSIsImJ5dGVMZW5ndGgiLCJsZW5ndGgiLCJoaWRwaSIsImV2ZXJ5IiwidmFsIiwiaSIsImFsbCIsImluZm9Gb3JJbWFnZUZpbGUiLCJtYXRyaXhDbGllbnQiLCJyb29tSWQiLCJ0aHVtYm5haWxUeXBlIiwiaW1hZ2VJbmZvIiwiciIsInJlc3VsdCIsInVwbG9hZEZpbGUiLCJ0aHVtYm5haWxfdXJsIiwidXJsIiwidGh1bWJuYWlsX2ZpbGUiLCJmaWxlIiwibG9hZFZpZGVvRWxlbWVudCIsInZpZGVvRmlsZSIsInZpZGVvIiwicmVhZGVyIiwiRmlsZVJlYWRlciIsInRhcmdldCIsIm9ubG9hZGVkZGF0YSIsInJlYWRBc0RhdGFVUkwiLCJpbmZvRm9yVmlkZW9GaWxlIiwidmlkZW9JbmZvIiwidmlkZW9XaWR0aCIsInZpZGVvSGVpZ2h0IiwicmVhZEFzQXJyYXlCdWZmZXIiLCJwcm9ncmVzc0hhbmRsZXIiLCJpc1Jvb21FbmNyeXB0ZWQiLCJjYW5jZWxlZCIsInVwbG9hZFByb21pc2UiLCJlbmNyeXB0SW5mbyIsInByb20iLCJlbmNyeXB0IiwiZW5jcnlwdEF0dGFjaG1lbnQiLCJlbmNyeXB0UmVzdWx0IiwiYmxvYiIsIkJsb2IiLCJ1cGxvYWRDb250ZW50IiwiaW5jbHVkZUZpbGVuYW1lIiwiYWJvcnQiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJjYW5jZWxVcGxvYWQiLCJiYXNlUHJvbWlzZSIsInByb21pc2UxIiwiQ29udGVudE1lc3NhZ2VzIiwiY29uc3RydWN0b3IiLCJpbnByb2dyZXNzIiwibmV4dElkIiwiX21lZGlhQ29uZmlnIiwic2hhcmVkSW5zdGFuY2UiLCJnbG9iYWwiLCJteF9Db250ZW50TWVzc2FnZXMiLCJ1bmRlZmluZWQiLCJfaXNGaWxlU2l6ZUFjY2VwdGFibGUiLCJfZW5zdXJlTWVkaWFDb25maWdGZXRjaGVkIiwiY29uc29sZSIsImxvZyIsImdldE1lZGlhQ29uZmlnIiwiY29uZmlnIiwiY2F0Y2giLCJzZW5kU3RpY2tlckNvbnRlbnRUb1Jvb20iLCJ0ZXh0Iiwic2VuZFN0aWNrZXJNZXNzYWdlIiwid2FybiIsImdldFVwbG9hZExpbWl0Iiwic2VuZENvbnRlbnRMaXN0VG9Sb29tIiwiZmlsZXMiLCJpc0d1ZXN0IiwiZGlzIiwiZGlzcGF0Y2giLCJhY3Rpb24iLCJpc1F1b3RpbmciLCJCb29sZWFuIiwiUm9vbVZpZXdTdG9yZSIsImdldFF1b3RpbmdFdmVudCIsIlF1ZXN0aW9uRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50Iiwic2hvdWxkVXBsb2FkIiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImhhc0NhbmNlbEJ1dHRvbiIsImJ1dHRvbiIsIm9uRmluaXNoZWQiLCJ0b29CaWdGaWxlcyIsIm9rRmlsZXMiLCJwdXNoIiwiVXBsb2FkRmFpbHVyZURpYWxvZyIsInVwbG9hZEZhaWx1cmVEaWFsb2dQcm9taXNlIiwiYmFkRmlsZXMiLCJ0b3RhbEZpbGVzIiwiY29udGVudE1lc3NhZ2VzIiwic2hvdWxkQ29udGludWUiLCJVcGxvYWRDb25maXJtRGlhbG9nIiwidXBsb2FkQWxsIiwicHJvbUJlZm9yZSIsImN1cnJlbnRJbmRleCIsInNob3VsZFVwbG9hZEFsbCIsIl9zZW5kQ29udGVudFRvUm9vbSIsImNvbnRlbnQiLCJib2R5IiwiaW5kZXhPZiIsIm1zZ3R5cGUiLCJlcnJvciIsInVwbG9hZCIsImZpbGVOYW1lIiwidG90YWwiLCJsb2FkZWQiLCJvblByb2dyZXNzIiwiZXYiLCJwcm9taXNlIiwic2VuZE1lc3NhZ2UiLCJlcnIiLCJkZXNjIiwiaHR0cF9zdGF0dXMiLCJFcnJvckRpYWxvZyIsImZpbmFsbHkiLCJpbnByb2dyZXNzS2V5cyIsIk9iamVjdCIsImtleXMiLCJrIiwic3BsaWNlIiwiZ2V0Q3VycmVudFVwbG9hZHMiLCJmaWx0ZXIiLCJ1Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQTs7Ozs7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFEQTtBQUdBLE1BQU1BLFNBQVMsR0FBRyxHQUFsQjtBQUNBLE1BQU1DLFVBQVUsR0FBRyxHQUFuQixDLENBRUE7QUFDQTs7QUFDQSxNQUFNQyxVQUFVLEdBQUcsQ0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLElBQWIsRUFBbUIsSUFBbkIsRUFBeUIsSUFBekIsRUFBK0IsSUFBL0IsRUFBcUMsSUFBckMsRUFBMkMsSUFBM0MsRUFBaUQsSUFBakQsQ0FBbkI7O0FBRU8sTUFBTUMsbUJBQU4sU0FBa0NDLEtBQWxDLENBQXdDO0FBRS9DOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLFNBQVNDLGVBQVQsQ0FBeUJDLE9BQXpCLEVBQWtDQyxVQUFsQyxFQUE4Q0MsV0FBOUMsRUFBMkRDLFFBQTNELEVBQXFFO0FBQ2pFLFNBQU8sSUFBSUMsT0FBSixDQUFhQyxPQUFELElBQWE7QUFDNUIsUUFBSUMsV0FBVyxHQUFHTCxVQUFsQjtBQUNBLFFBQUlNLFlBQVksR0FBR0wsV0FBbkI7O0FBQ0EsUUFBSUssWUFBWSxHQUFHWixVQUFuQixFQUErQjtBQUMzQlcsTUFBQUEsV0FBVyxHQUFHRSxJQUFJLENBQUNDLEtBQUwsQ0FBV0gsV0FBVyxJQUFJWCxVQUFVLEdBQUdZLFlBQWpCLENBQXRCLENBQWQ7QUFDQUEsTUFBQUEsWUFBWSxHQUFHWixVQUFmO0FBQ0g7O0FBQ0QsUUFBSVcsV0FBVyxHQUFHWixTQUFsQixFQUE2QjtBQUN6QmEsTUFBQUEsWUFBWSxHQUFHQyxJQUFJLENBQUNDLEtBQUwsQ0FBV0YsWUFBWSxJQUFJYixTQUFTLEdBQUdZLFdBQWhCLENBQXZCLENBQWY7QUFDQUEsTUFBQUEsV0FBVyxHQUFHWixTQUFkO0FBQ0g7O0FBRUQsVUFBTWdCLE1BQU0sR0FBR0MsUUFBUSxDQUFDQyxhQUFULENBQXVCLFFBQXZCLENBQWY7QUFDQUYsSUFBQUEsTUFBTSxDQUFDRyxLQUFQLEdBQWVQLFdBQWY7QUFDQUksSUFBQUEsTUFBTSxDQUFDSSxNQUFQLEdBQWdCUCxZQUFoQjtBQUNBRyxJQUFBQSxNQUFNLENBQUNLLFVBQVAsQ0FBa0IsSUFBbEIsRUFBd0JDLFNBQXhCLENBQWtDaEIsT0FBbEMsRUFBMkMsQ0FBM0MsRUFBOEMsQ0FBOUMsRUFBaURNLFdBQWpELEVBQThEQyxZQUE5RDtBQUNBRyxJQUFBQSxNQUFNLENBQUNPLE1BQVAsQ0FBYyxVQUFTQyxTQUFULEVBQW9CO0FBQzlCYixNQUFBQSxPQUFPLENBQUM7QUFDSmMsUUFBQUEsSUFBSSxFQUFFO0FBQ0ZDLFVBQUFBLGNBQWMsRUFBRTtBQUNaQyxZQUFBQSxDQUFDLEVBQUVmLFdBRFM7QUFFWmdCLFlBQUFBLENBQUMsRUFBRWYsWUFGUztBQUdaZ0IsWUFBQUEsUUFBUSxFQUFFTCxTQUFTLENBQUNNLElBSFI7QUFJWkMsWUFBQUEsSUFBSSxFQUFFUCxTQUFTLENBQUNPO0FBSkosV0FEZDtBQU9GSixVQUFBQSxDQUFDLEVBQUVwQixVQVBEO0FBUUZxQixVQUFBQSxDQUFDLEVBQUVwQjtBQVJELFNBREY7QUFXSmdCLFFBQUFBLFNBQVMsRUFBRUE7QUFYUCxPQUFELENBQVA7QUFhSCxLQWRELEVBY0dmLFFBZEg7QUFlSCxHQS9CTSxDQUFQO0FBZ0NIO0FBRUQ7Ozs7Ozs7O0FBTUEsZUFBZXVCLGdCQUFmLENBQWdDQyxTQUFoQyxFQUEyQztBQUN2QztBQUNBLFFBQU1DLEdBQUcsR0FBR2pCLFFBQVEsQ0FBQ0MsYUFBVCxDQUF1QixLQUF2QixDQUFaO0FBQ0EsUUFBTWlCLFNBQVMsR0FBR0MsR0FBRyxDQUFDQyxlQUFKLENBQW9CSixTQUFwQixDQUFsQjtBQUNBLFFBQU1LLFVBQVUsR0FBRyxJQUFJNUIsT0FBSixDQUFZLENBQUNDLE9BQUQsRUFBVTRCLE1BQVYsS0FBcUI7QUFDaERMLElBQUFBLEdBQUcsQ0FBQ00sTUFBSixHQUFhLFlBQVc7QUFDcEJKLE1BQUFBLEdBQUcsQ0FBQ0ssZUFBSixDQUFvQk4sU0FBcEI7QUFDQXhCLE1BQUFBLE9BQU8sQ0FBQ3VCLEdBQUQsQ0FBUDtBQUNILEtBSEQ7O0FBSUFBLElBQUFBLEdBQUcsQ0FBQ1EsT0FBSixHQUFjLFVBQVNDLENBQVQsRUFBWTtBQUN0QkosTUFBQUEsTUFBTSxDQUFDSSxDQUFELENBQU47QUFDSCxLQUZEO0FBR0gsR0FSa0IsQ0FBbkI7QUFTQVQsRUFBQUEsR0FBRyxDQUFDVSxHQUFKLEdBQVVULFNBQVYsQ0FidUMsQ0FldkM7QUFDQTs7QUFDQSxNQUFJVSxZQUFKOztBQUNBLE1BQUlaLFNBQVMsQ0FBQ0gsSUFBVixLQUFtQixXQUF2QixFQUFvQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQU1nQixPQUFPLEdBQUdiLFNBQWhCLENBTGdDLENBS0w7O0FBQzNCWSxJQUFBQSxZQUFZLEdBQUdFLHFCQUFxQixDQUFDRCxPQUFELENBQXJCLENBQStCRSxJQUEvQixDQUFvQ0MsV0FBVyxJQUFJO0FBQzlELFlBQU1DLE1BQU0sR0FBRyxJQUFJQyxVQUFKLENBQWVGLFdBQWYsQ0FBZjtBQUNBLFlBQU1HLE1BQU0sR0FBRywrQkFBaUJGLE1BQWpCLENBQWY7O0FBQ0EsV0FBSyxNQUFNRyxLQUFYLElBQW9CRCxNQUFwQixFQUE0QjtBQUN4QixZQUFJQyxLQUFLLENBQUNDLElBQU4sS0FBZSxNQUFuQixFQUEyQjtBQUN2QixjQUFJRCxLQUFLLENBQUNFLElBQU4sQ0FBV0MsVUFBWCxLQUEwQnRELFVBQVUsQ0FBQ3VELE1BQXpDLEVBQWlEO0FBQ2pELGdCQUFNQyxLQUFLLEdBQUdMLEtBQUssQ0FBQ0UsSUFBTixDQUFXSSxLQUFYLENBQWlCLENBQUNDLEdBQUQsRUFBTUMsQ0FBTixLQUFZRCxHQUFHLEtBQUsxRCxVQUFVLENBQUMyRCxDQUFELENBQS9DLENBQWQ7QUFDQSxpQkFBT0gsS0FBUDtBQUNIO0FBQ0o7O0FBQ0QsYUFBTyxLQUFQO0FBQ0gsS0FYYyxDQUFmO0FBWUg7O0FBRUQsUUFBTSxDQUFDQSxLQUFELElBQVUsTUFBTWhELE9BQU8sQ0FBQ29ELEdBQVIsQ0FBWSxDQUFDakIsWUFBRCxFQUFlUCxVQUFmLENBQVosQ0FBdEI7QUFDQSxRQUFNbkIsS0FBSyxHQUFHdUMsS0FBSyxHQUFJeEIsR0FBRyxDQUFDZixLQUFKLElBQWEsQ0FBakIsR0FBc0JlLEdBQUcsQ0FBQ2YsS0FBN0M7QUFDQSxRQUFNQyxNQUFNLEdBQUdzQyxLQUFLLEdBQUl4QixHQUFHLENBQUNkLE1BQUosSUFBYyxDQUFsQixHQUF1QmMsR0FBRyxDQUFDZCxNQUEvQztBQUNBLFNBQU87QUFBQ0QsSUFBQUEsS0FBRDtBQUFRQyxJQUFBQSxNQUFSO0FBQWdCYyxJQUFBQTtBQUFoQixHQUFQO0FBQ0g7QUFFRDs7Ozs7Ozs7OztBQVFBLFNBQVM2QixnQkFBVCxDQUEwQkMsWUFBMUIsRUFBd0NDLE1BQXhDLEVBQWdEaEMsU0FBaEQsRUFBMkQ7QUFDdkQsTUFBSWlDLGFBQWEsR0FBRyxXQUFwQjs7QUFDQSxNQUFJakMsU0FBUyxDQUFDSCxJQUFWLElBQWtCLFlBQXRCLEVBQW9DO0FBQ2hDb0MsSUFBQUEsYUFBYSxHQUFHLFlBQWhCO0FBQ0g7O0FBRUQsTUFBSUMsU0FBSjtBQUNBLFNBQU9uQyxnQkFBZ0IsQ0FBQ0MsU0FBRCxDQUFoQixDQUE0QmUsSUFBNUIsQ0FBaUMsVUFBU29CLENBQVQsRUFBWTtBQUNoRCxXQUFPL0QsZUFBZSxDQUFDK0QsQ0FBQyxDQUFDbEMsR0FBSCxFQUFRa0MsQ0FBQyxDQUFDakQsS0FBVixFQUFpQmlELENBQUMsQ0FBQ2hELE1BQW5CLEVBQTJCOEMsYUFBM0IsQ0FBdEI7QUFDSCxHQUZNLEVBRUpsQixJQUZJLENBRUMsVUFBU3FCLE1BQVQsRUFBaUI7QUFDckJGLElBQUFBLFNBQVMsR0FBR0UsTUFBTSxDQUFDNUMsSUFBbkI7QUFDQSxXQUFPNkMsVUFBVSxDQUFDTixZQUFELEVBQWVDLE1BQWYsRUFBdUJJLE1BQU0sQ0FBQzdDLFNBQTlCLENBQWpCO0FBQ0gsR0FMTSxFQUtKd0IsSUFMSSxDQUtDLFVBQVNxQixNQUFULEVBQWlCO0FBQ3JCRixJQUFBQSxTQUFTLENBQUNJLGFBQVYsR0FBMEJGLE1BQU0sQ0FBQ0csR0FBakM7QUFDQUwsSUFBQUEsU0FBUyxDQUFDTSxjQUFWLEdBQTJCSixNQUFNLENBQUNLLElBQWxDO0FBQ0EsV0FBT1AsU0FBUDtBQUNILEdBVE0sQ0FBUDtBQVVIO0FBRUQ7Ozs7Ozs7O0FBTUEsU0FBU1EsZ0JBQVQsQ0FBMEJDLFNBQTFCLEVBQXFDO0FBQ2pDLFNBQU8sSUFBSWxFLE9BQUosQ0FBWSxDQUFDQyxPQUFELEVBQVU0QixNQUFWLEtBQXFCO0FBQ3BDO0FBQ0EsVUFBTXNDLEtBQUssR0FBRzVELFFBQVEsQ0FBQ0MsYUFBVCxDQUF1QixPQUF2QixDQUFkO0FBRUEsVUFBTTRELE1BQU0sR0FBRyxJQUFJQyxVQUFKLEVBQWY7O0FBRUFELElBQUFBLE1BQU0sQ0FBQ3RDLE1BQVAsR0FBZ0IsVUFBU0csQ0FBVCxFQUFZO0FBQ3hCa0MsTUFBQUEsS0FBSyxDQUFDakMsR0FBTixHQUFZRCxDQUFDLENBQUNxQyxNQUFGLENBQVNYLE1BQXJCLENBRHdCLENBR3hCO0FBQ0E7O0FBQ0FRLE1BQUFBLEtBQUssQ0FBQ0ksWUFBTixHQUFxQixZQUFXO0FBQzVCdEUsUUFBQUEsT0FBTyxDQUFDa0UsS0FBRCxDQUFQO0FBQ0gsT0FGRDs7QUFHQUEsTUFBQUEsS0FBSyxDQUFDbkMsT0FBTixHQUFnQixVQUFTQyxDQUFULEVBQVk7QUFDeEJKLFFBQUFBLE1BQU0sQ0FBQ0ksQ0FBRCxDQUFOO0FBQ0gsT0FGRDtBQUdILEtBWEQ7O0FBWUFtQyxJQUFBQSxNQUFNLENBQUNwQyxPQUFQLEdBQWlCLFVBQVNDLENBQVQsRUFBWTtBQUN6QkosTUFBQUEsTUFBTSxDQUFDSSxDQUFELENBQU47QUFDSCxLQUZEOztBQUdBbUMsSUFBQUEsTUFBTSxDQUFDSSxhQUFQLENBQXFCTixTQUFyQjtBQUNILEdBdEJNLENBQVA7QUF1Qkg7QUFFRDs7Ozs7Ozs7OztBQVFBLFNBQVNPLGdCQUFULENBQTBCbkIsWUFBMUIsRUFBd0NDLE1BQXhDLEVBQWdEVyxTQUFoRCxFQUEyRDtBQUN2RCxRQUFNVixhQUFhLEdBQUcsWUFBdEI7QUFFQSxNQUFJa0IsU0FBSjtBQUNBLFNBQU9ULGdCQUFnQixDQUFDQyxTQUFELENBQWhCLENBQTRCNUIsSUFBNUIsQ0FBaUMsVUFBUzZCLEtBQVQsRUFBZ0I7QUFDcEQsV0FBT3hFLGVBQWUsQ0FBQ3dFLEtBQUQsRUFBUUEsS0FBSyxDQUFDUSxVQUFkLEVBQTBCUixLQUFLLENBQUNTLFdBQWhDLEVBQTZDcEIsYUFBN0MsQ0FBdEI7QUFDSCxHQUZNLEVBRUpsQixJQUZJLENBRUMsVUFBU3FCLE1BQVQsRUFBaUI7QUFDckJlLElBQUFBLFNBQVMsR0FBR2YsTUFBTSxDQUFDNUMsSUFBbkI7QUFDQSxXQUFPNkMsVUFBVSxDQUFDTixZQUFELEVBQWVDLE1BQWYsRUFBdUJJLE1BQU0sQ0FBQzdDLFNBQTlCLENBQWpCO0FBQ0gsR0FMTSxFQUtKd0IsSUFMSSxDQUtDLFVBQVNxQixNQUFULEVBQWlCO0FBQ3JCZSxJQUFBQSxTQUFTLENBQUNiLGFBQVYsR0FBMEJGLE1BQU0sQ0FBQ0csR0FBakM7QUFDQVksSUFBQUEsU0FBUyxDQUFDWCxjQUFWLEdBQTJCSixNQUFNLENBQUNLLElBQWxDO0FBQ0EsV0FBT1UsU0FBUDtBQUNILEdBVE0sQ0FBUDtBQVVIO0FBRUQ7Ozs7Ozs7O0FBTUEsU0FBU3JDLHFCQUFULENBQStCMkIsSUFBL0IsRUFBcUM7QUFDakMsU0FBTyxJQUFJaEUsT0FBSixDQUFZLENBQUNDLE9BQUQsRUFBVTRCLE1BQVYsS0FBcUI7QUFDcEMsVUFBTXVDLE1BQU0sR0FBRyxJQUFJQyxVQUFKLEVBQWY7O0FBQ0FELElBQUFBLE1BQU0sQ0FBQ3RDLE1BQVAsR0FBZ0IsVUFBU0csQ0FBVCxFQUFZO0FBQ3hCaEMsTUFBQUEsT0FBTyxDQUFDZ0MsQ0FBQyxDQUFDcUMsTUFBRixDQUFTWCxNQUFWLENBQVA7QUFDSCxLQUZEOztBQUdBUyxJQUFBQSxNQUFNLENBQUNwQyxPQUFQLEdBQWlCLFVBQVNDLENBQVQsRUFBWTtBQUN6QkosTUFBQUEsTUFBTSxDQUFDSSxDQUFELENBQU47QUFDSCxLQUZEOztBQUdBbUMsSUFBQUEsTUFBTSxDQUFDUyxpQkFBUCxDQUF5QmIsSUFBekI7QUFDSCxHQVRNLENBQVA7QUFVSDtBQUVEOzs7Ozs7Ozs7Ozs7Ozs7QUFhQSxTQUFTSixVQUFULENBQW9CTixZQUFwQixFQUFrQ0MsTUFBbEMsRUFBMENTLElBQTFDLEVBQWdEYyxlQUFoRCxFQUFpRTtBQUM3RCxNQUFJeEIsWUFBWSxDQUFDeUIsZUFBYixDQUE2QnhCLE1BQTdCLENBQUosRUFBMEM7QUFDdEM7QUFDQTtBQUNBLFFBQUl5QixRQUFRLEdBQUcsS0FBZjtBQUNBLFFBQUlDLGFBQUo7QUFDQSxRQUFJQyxXQUFKO0FBQ0EsVUFBTUMsSUFBSSxHQUFHOUMscUJBQXFCLENBQUMyQixJQUFELENBQXJCLENBQTRCMUIsSUFBNUIsQ0FBaUMsVUFBU08sSUFBVCxFQUFlO0FBQ3pELFVBQUltQyxRQUFKLEVBQWMsTUFBTSxJQUFJdkYsbUJBQUosRUFBTixDQUQyQyxDQUV6RDs7QUFDQSxhQUFPMkYsa0NBQVFDLGlCQUFSLENBQTBCeEMsSUFBMUIsQ0FBUDtBQUNILEtBSlksRUFJVlAsSUFKVSxDQUlMLFVBQVNnRCxhQUFULEVBQXdCO0FBQzVCLFVBQUlOLFFBQUosRUFBYyxNQUFNLElBQUl2RixtQkFBSixFQUFOLENBRGMsQ0FFNUI7O0FBQ0F5RixNQUFBQSxXQUFXLEdBQUdJLGFBQWEsQ0FBQ3ZFLElBQTVCLENBSDRCLENBSTVCOztBQUNBLFlBQU13RSxJQUFJLEdBQUcsSUFBSUMsSUFBSixDQUFTLENBQUNGLGFBQWEsQ0FBQ3pDLElBQWYsQ0FBVCxDQUFiO0FBQ0FvQyxNQUFBQSxhQUFhLEdBQUczQixZQUFZLENBQUNtQyxhQUFiLENBQTJCRixJQUEzQixFQUFpQztBQUM3Q1QsUUFBQUEsZUFBZSxFQUFFQSxlQUQ0QjtBQUU3Q1ksUUFBQUEsZUFBZSxFQUFFO0FBRjRCLE9BQWpDLENBQWhCO0FBS0EsYUFBT1QsYUFBUDtBQUNILEtBaEJZLEVBZ0JWM0MsSUFoQlUsQ0FnQkwsVUFBU3dCLEdBQVQsRUFBYztBQUNsQjtBQUNBO0FBQ0E7QUFDQW9CLE1BQUFBLFdBQVcsQ0FBQ3BCLEdBQVosR0FBa0JBLEdBQWxCOztBQUNBLFVBQUlFLElBQUksQ0FBQzVDLElBQVQsRUFBZTtBQUNYOEQsUUFBQUEsV0FBVyxDQUFDL0QsUUFBWixHQUF1QjZDLElBQUksQ0FBQzVDLElBQTVCO0FBQ0g7O0FBQ0QsYUFBTztBQUFDLGdCQUFROEQ7QUFBVCxPQUFQO0FBQ0gsS0F6QlksQ0FBYjs7QUEwQkFDLElBQUFBLElBQUksQ0FBQ1EsS0FBTCxHQUFhLE1BQU07QUFDZlgsTUFBQUEsUUFBUSxHQUFHLElBQVg7QUFDQSxVQUFJQyxhQUFKLEVBQW1CVyxpQ0FBZ0JDLEdBQWhCLEdBQXNCQyxZQUF0QixDQUFtQ2IsYUFBbkM7QUFDdEIsS0FIRDs7QUFJQSxXQUFPRSxJQUFQO0FBQ0gsR0FyQ0QsTUFxQ087QUFDSCxVQUFNWSxXQUFXLEdBQUd6QyxZQUFZLENBQUNtQyxhQUFiLENBQTJCekIsSUFBM0IsRUFBaUM7QUFDakRjLE1BQUFBLGVBQWUsRUFBRUE7QUFEZ0MsS0FBakMsQ0FBcEI7QUFHQSxVQUFNa0IsUUFBUSxHQUFHRCxXQUFXLENBQUN6RCxJQUFaLENBQWlCLFVBQVN3QixHQUFULEVBQWM7QUFDNUM7QUFDQSxhQUFPO0FBQUMsZUFBT0E7QUFBUixPQUFQO0FBQ0gsS0FIZ0IsQ0FBakIsQ0FKRyxDQVFIOztBQUNBa0MsSUFBQUEsUUFBUSxDQUFDTCxLQUFULEdBQWlCSSxXQUFXLENBQUNKLEtBQTdCO0FBQ0EsV0FBT0ssUUFBUDtBQUNIO0FBQ0o7O0FBRWMsTUFBTUMsZUFBTixDQUFzQjtBQUNqQ0MsRUFBQUEsV0FBVyxHQUFHO0FBQ1YsU0FBS0MsVUFBTCxHQUFrQixFQUFsQjtBQUNBLFNBQUtDLE1BQUwsR0FBYyxDQUFkO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQixJQUFwQjtBQUNIOztBQUVELFNBQU9DLGNBQVAsR0FBd0I7QUFDcEIsUUFBSUMsTUFBTSxDQUFDQyxrQkFBUCxLQUE4QkMsU0FBbEMsRUFBNkM7QUFDekNGLE1BQUFBLE1BQU0sQ0FBQ0Msa0JBQVAsR0FBNEIsSUFBSVAsZUFBSixFQUE1QjtBQUNIOztBQUNELFdBQU9NLE1BQU0sQ0FBQ0Msa0JBQWQ7QUFDSDs7QUFFREUsRUFBQUEscUJBQXFCLENBQUMxQyxJQUFELEVBQU87QUFDeEIsUUFBSSxLQUFLcUMsWUFBTCxLQUFzQixJQUF0QixJQUNBLEtBQUtBLFlBQUwsQ0FBa0IsZUFBbEIsTUFBdUNJLFNBRHZDLElBRUF6QyxJQUFJLENBQUMzQyxJQUFMLEdBQVksS0FBS2dGLFlBQUwsQ0FBa0IsZUFBbEIsQ0FGaEIsRUFFb0Q7QUFDaEQsYUFBTyxLQUFQO0FBQ0g7O0FBQ0QsV0FBTyxJQUFQO0FBQ0g7O0FBRURNLEVBQUFBLHlCQUF5QixHQUFHO0FBQ3hCLFFBQUksS0FBS04sWUFBTCxLQUFzQixJQUExQixFQUFnQztBQUVoQ08sSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVkseUJBQVo7QUFDQSxXQUFPakIsaUNBQWdCQyxHQUFoQixHQUFzQmlCLGNBQXRCLEdBQXVDeEUsSUFBdkMsQ0FBNkN5RSxNQUFELElBQVk7QUFDM0RILE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGdDQUFaLEVBQThDRSxNQUE5QztBQUNBLGFBQU9BLE1BQVA7QUFDSCxLQUhNLEVBR0pDLEtBSEksQ0FHRSxNQUFNO0FBQ1g7QUFDQUosTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksaUVBQVo7QUFDQSxhQUFPLEVBQVA7QUFDSCxLQVBNLEVBT0p2RSxJQVBJLENBT0V5RSxNQUFELElBQVk7QUFDaEIsV0FBS1YsWUFBTCxHQUFvQlUsTUFBcEI7QUFDSCxLQVRNLENBQVA7QUFVSDs7QUFFREUsRUFBQUEsd0JBQXdCLENBQUNuRCxHQUFELEVBQU1QLE1BQU4sRUFBY3hDLElBQWQsRUFBb0JtRyxJQUFwQixFQUEwQjVELFlBQTFCLEVBQXdDO0FBQzVELFdBQU9zQyxpQ0FBZ0JDLEdBQWhCLEdBQXNCc0Isa0JBQXRCLENBQXlDNUQsTUFBekMsRUFBaURPLEdBQWpELEVBQXNEL0MsSUFBdEQsRUFBNERtRyxJQUE1RCxFQUFrRUYsS0FBbEUsQ0FBeUUvRSxDQUFELElBQU87QUFDbEYyRSxNQUFBQSxPQUFPLENBQUNRLElBQVIsMkNBQWdEdEQsR0FBaEQsc0JBQStEUCxNQUEvRCxHQUF5RXRCLENBQXpFO0FBQ0EsWUFBTUEsQ0FBTjtBQUNILEtBSE0sQ0FBUDtBQUlIOztBQUVEb0YsRUFBQUEsY0FBYyxHQUFHO0FBQ2IsUUFBSSxLQUFLaEIsWUFBTCxLQUFzQixJQUF0QixJQUE4QixLQUFLQSxZQUFMLENBQWtCLGVBQWxCLE1BQXVDSSxTQUF6RSxFQUFvRjtBQUNoRixhQUFPLEtBQUtKLFlBQUwsQ0FBa0IsZUFBbEIsQ0FBUDtBQUNILEtBRkQsTUFFTztBQUNILGFBQU8sSUFBUDtBQUNIO0FBQ0o7O0FBRUQsUUFBTWlCLHFCQUFOLENBQTRCQyxLQUE1QixFQUFtQ2hFLE1BQW5DLEVBQTJDRCxZQUEzQyxFQUF5RDtBQUNyRCxRQUFJQSxZQUFZLENBQUNrRSxPQUFiLEVBQUosRUFBNEI7QUFDeEJDLDBCQUFJQyxRQUFKLENBQWE7QUFBQ0MsUUFBQUEsTUFBTSxFQUFFO0FBQVQsT0FBYjs7QUFDQTtBQUNIOztBQUVELFVBQU1DLFNBQVMsR0FBR0MsT0FBTyxDQUFDQyx1QkFBY0MsZUFBZCxFQUFELENBQXpCOztBQUNBLFFBQUlILFNBQUosRUFBZTtBQUNYLFlBQU1JLGNBQWMsR0FBR0MsR0FBRyxDQUFDQyxZQUFKLENBQWlCLHdCQUFqQixDQUF2QjtBQUNBLFlBQU1DLFlBQVksR0FBRyxNQUFNLElBQUluSSxPQUFKLENBQWFDLE9BQUQsSUFBYTtBQUNoRG1JLHVCQUFNQyxtQkFBTixDQUEwQixzQkFBMUIsRUFBa0QsRUFBbEQsRUFBc0RMLGNBQXRELEVBQXNFO0FBQ2xFTSxVQUFBQSxLQUFLLEVBQUUseUJBQUcscUJBQUgsQ0FEMkQ7QUFFbEVDLFVBQUFBLFdBQVcsZUFDUCxpQ0FBTSx5QkFDRiwyREFDQSxzREFGRSxDQUFOLENBSDhEO0FBUWxFQyxVQUFBQSxlQUFlLEVBQUUsSUFSaUQ7QUFTbEVDLFVBQUFBLE1BQU0sRUFBRSx5QkFBRyxVQUFILENBVDBEO0FBVWxFQyxVQUFBQSxVQUFVLEVBQUdQLFlBQUQsSUFBa0I7QUFDMUJsSSxZQUFBQSxPQUFPLENBQUNrSSxZQUFELENBQVA7QUFDSDtBQVppRSxTQUF0RTtBQWNILE9BZjBCLENBQTNCO0FBZ0JBLFVBQUksQ0FBQ0EsWUFBTCxFQUFtQjtBQUN0Qjs7QUFFRCxVQUFNLEtBQUt4Qix5QkFBTCxFQUFOO0FBRUEsVUFBTWdDLFdBQVcsR0FBRyxFQUFwQjtBQUNBLFVBQU1DLE9BQU8sR0FBRyxFQUFoQjs7QUFFQSxTQUFLLElBQUl6RixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHb0UsS0FBSyxDQUFDeEUsTUFBMUIsRUFBa0MsRUFBRUksQ0FBcEMsRUFBdUM7QUFDbkMsVUFBSSxLQUFLdUQscUJBQUwsQ0FBMkJhLEtBQUssQ0FBQ3BFLENBQUQsQ0FBaEMsQ0FBSixFQUEwQztBQUN0Q3lGLFFBQUFBLE9BQU8sQ0FBQ0MsSUFBUixDQUFhdEIsS0FBSyxDQUFDcEUsQ0FBRCxDQUFsQjtBQUNILE9BRkQsTUFFTztBQUNId0YsUUFBQUEsV0FBVyxDQUFDRSxJQUFaLENBQWlCdEIsS0FBSyxDQUFDcEUsQ0FBRCxDQUF0QjtBQUNIO0FBQ0o7O0FBRUQsUUFBSXdGLFdBQVcsQ0FBQzVGLE1BQVosR0FBcUIsQ0FBekIsRUFBNEI7QUFDeEIsWUFBTStGLG1CQUFtQixHQUFHYixHQUFHLENBQUNDLFlBQUosQ0FBaUIsNkJBQWpCLENBQTVCO0FBQ0EsWUFBTWEsMEJBQTBCLEdBQUcsSUFBSS9JLE9BQUosQ0FBYUMsT0FBRCxJQUFhO0FBQ3hEbUksdUJBQU1DLG1CQUFOLENBQTBCLGdCQUExQixFQUE0QyxFQUE1QyxFQUFnRFMsbUJBQWhELEVBQXFFO0FBQ2pFRSxVQUFBQSxRQUFRLEVBQUVMLFdBRHVEO0FBRWpFTSxVQUFBQSxVQUFVLEVBQUUxQixLQUFLLENBQUN4RSxNQUYrQztBQUdqRW1HLFVBQUFBLGVBQWUsRUFBRSxJQUhnRDtBQUlqRVIsVUFBQUEsVUFBVSxFQUFHUyxjQUFELElBQW9CO0FBQzVCbEosWUFBQUEsT0FBTyxDQUFDa0osY0FBRCxDQUFQO0FBQ0g7QUFOZ0UsU0FBckU7QUFRSCxPQVRrQyxDQUFuQztBQVVBLFlBQU1BLGNBQWMsR0FBRyxNQUFNSiwwQkFBN0I7QUFDQSxVQUFJLENBQUNJLGNBQUwsRUFBcUI7QUFDeEI7O0FBRUQsVUFBTUMsbUJBQW1CLEdBQUduQixHQUFHLENBQUNDLFlBQUosQ0FBaUIsNkJBQWpCLENBQTVCO0FBQ0EsUUFBSW1CLFNBQVMsR0FBRyxLQUFoQixDQTFEcUQsQ0EyRHJEO0FBQ0E7O0FBQ0EsUUFBSUMsVUFBVSxHQUFHdEosT0FBTyxDQUFDQyxPQUFSLEVBQWpCOztBQUNBLFNBQUssSUFBSWtELENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUd5RixPQUFPLENBQUM3RixNQUE1QixFQUFvQyxFQUFFSSxDQUF0QyxFQUF5QztBQUNyQyxZQUFNYSxJQUFJLEdBQUc0RSxPQUFPLENBQUN6RixDQUFELENBQXBCOztBQUNBLFVBQUksQ0FBQ2tHLFNBQUwsRUFBZ0I7QUFDWixjQUFNRixjQUFjLEdBQUcsTUFBTSxJQUFJbkosT0FBSixDQUFhQyxPQUFELElBQWE7QUFDbERtSSx5QkFBTUMsbUJBQU4sQ0FBMEIsMkJBQTFCLEVBQXVELEVBQXZELEVBQTJEZSxtQkFBM0QsRUFBZ0Y7QUFDNUVwRixZQUFBQSxJQUQ0RTtBQUU1RXVGLFlBQUFBLFlBQVksRUFBRXBHLENBRjhEO0FBRzVFOEYsWUFBQUEsVUFBVSxFQUFFTCxPQUFPLENBQUM3RixNQUh3RDtBQUk1RTJGLFlBQUFBLFVBQVUsRUFBRSxDQUFDUyxjQUFELEVBQWlCSyxlQUFqQixLQUFxQztBQUM3QyxrQkFBSUEsZUFBSixFQUFxQjtBQUNqQkgsZ0JBQUFBLFNBQVMsR0FBRyxJQUFaO0FBQ0g7O0FBQ0RwSixjQUFBQSxPQUFPLENBQUNrSixjQUFELENBQVA7QUFDSDtBQVQyRSxXQUFoRjtBQVdILFNBWjRCLENBQTdCO0FBYUEsWUFBSSxDQUFDQSxjQUFMLEVBQXFCO0FBQ3hCOztBQUNERyxNQUFBQSxVQUFVLEdBQUcsS0FBS0csa0JBQUwsQ0FBd0J6RixJQUF4QixFQUE4QlQsTUFBOUIsRUFBc0NELFlBQXRDLEVBQW9EZ0csVUFBcEQsQ0FBYjtBQUNIO0FBQ0o7O0FBRURHLEVBQUFBLGtCQUFrQixDQUFDekYsSUFBRCxFQUFPVCxNQUFQLEVBQWVELFlBQWYsRUFBNkJnRyxVQUE3QixFQUF5QztBQUN2RCxVQUFNSSxPQUFPLEdBQUc7QUFDWkMsTUFBQUEsSUFBSSxFQUFFM0YsSUFBSSxDQUFDcEIsSUFBTCxJQUFhLFlBRFA7QUFFWjdCLE1BQUFBLElBQUksRUFBRTtBQUNGTSxRQUFBQSxJQUFJLEVBQUUyQyxJQUFJLENBQUMzQztBQURUO0FBRk0sS0FBaEIsQ0FEdUQsQ0FRdkQ7O0FBQ0EsUUFBSTJDLElBQUksQ0FBQzVDLElBQVQsRUFBZTtBQUNYc0ksTUFBQUEsT0FBTyxDQUFDM0ksSUFBUixDQUFhSSxRQUFiLEdBQXdCNkMsSUFBSSxDQUFDNUMsSUFBN0I7QUFDSDs7QUFFRCxVQUFNK0QsSUFBSSxHQUFHLElBQUluRixPQUFKLENBQWFDLE9BQUQsSUFBYTtBQUNsQyxVQUFJK0QsSUFBSSxDQUFDNUMsSUFBTCxDQUFVd0ksT0FBVixDQUFrQixRQUFsQixLQUErQixDQUFuQyxFQUFzQztBQUNsQ0YsUUFBQUEsT0FBTyxDQUFDRyxPQUFSLEdBQWtCLFNBQWxCO0FBQ0F4RyxRQUFBQSxnQkFBZ0IsQ0FBQ0MsWUFBRCxFQUFlQyxNQUFmLEVBQXVCUyxJQUF2QixDQUFoQixDQUE2QzFCLElBQTdDLENBQW1EbUIsU0FBRCxJQUFhO0FBQzNELCtCQUFPaUcsT0FBTyxDQUFDM0ksSUFBZixFQUFxQjBDLFNBQXJCO0FBQ0F4RCxVQUFBQSxPQUFPO0FBQ1YsU0FIRCxFQUdJNkosS0FBRCxJQUFTO0FBQ1JsRCxVQUFBQSxPQUFPLENBQUNrRCxLQUFSLENBQWNBLEtBQWQ7QUFDQUosVUFBQUEsT0FBTyxDQUFDRyxPQUFSLEdBQWtCLFFBQWxCO0FBQ0E1SixVQUFBQSxPQUFPO0FBQ1YsU0FQRDtBQVFILE9BVkQsTUFVTyxJQUFJK0QsSUFBSSxDQUFDNUMsSUFBTCxDQUFVd0ksT0FBVixDQUFrQixRQUFsQixLQUErQixDQUFuQyxFQUFzQztBQUN6Q0YsUUFBQUEsT0FBTyxDQUFDRyxPQUFSLEdBQWtCLFNBQWxCO0FBQ0E1SixRQUFBQSxPQUFPO0FBQ1YsT0FITSxNQUdBLElBQUkrRCxJQUFJLENBQUM1QyxJQUFMLENBQVV3SSxPQUFWLENBQWtCLFFBQWxCLEtBQStCLENBQW5DLEVBQXNDO0FBQ3pDRixRQUFBQSxPQUFPLENBQUNHLE9BQVIsR0FBa0IsU0FBbEI7QUFDQXBGLFFBQUFBLGdCQUFnQixDQUFDbkIsWUFBRCxFQUFlQyxNQUFmLEVBQXVCUyxJQUF2QixDQUFoQixDQUE2QzFCLElBQTdDLENBQW1Eb0MsU0FBRCxJQUFhO0FBQzNELCtCQUFPZ0YsT0FBTyxDQUFDM0ksSUFBZixFQUFxQjJELFNBQXJCO0FBQ0F6RSxVQUFBQSxPQUFPO0FBQ1YsU0FIRCxFQUdJNkosS0FBRCxJQUFTO0FBQ1JKLFVBQUFBLE9BQU8sQ0FBQ0csT0FBUixHQUFrQixRQUFsQjtBQUNBNUosVUFBQUEsT0FBTztBQUNWLFNBTkQ7QUFPSCxPQVRNLE1BU0E7QUFDSHlKLFFBQUFBLE9BQU8sQ0FBQ0csT0FBUixHQUFrQixRQUFsQjtBQUNBNUosUUFBQUEsT0FBTztBQUNWO0FBQ0osS0EzQlksQ0FBYjtBQTZCQSxVQUFNOEosTUFBTSxHQUFHO0FBQ1hDLE1BQUFBLFFBQVEsRUFBRWhHLElBQUksQ0FBQ3BCLElBQUwsSUFBYSxZQURaO0FBRVhXLE1BQUFBLE1BQU0sRUFBRUEsTUFGRztBQUdYMEcsTUFBQUEsS0FBSyxFQUFFLENBSEk7QUFJWEMsTUFBQUEsTUFBTSxFQUFFO0FBSkcsS0FBZjtBQU1BLFNBQUsvRCxVQUFMLENBQWdCMEMsSUFBaEIsQ0FBcUJrQixNQUFyQjs7QUFDQXRDLHdCQUFJQyxRQUFKLENBQWE7QUFBQ0MsTUFBQUEsTUFBTSxFQUFFO0FBQVQsS0FBYixFQWpEdUQsQ0FtRHZEOzs7QUFDQUYsd0JBQUlDLFFBQUosQ0FBYTtBQUFDQyxNQUFBQSxNQUFNLEVBQUU7QUFBVCxLQUFiOztBQUVBLFFBQUltQyxLQUFKOztBQUVBLGFBQVNLLFVBQVQsQ0FBb0JDLEVBQXBCLEVBQXdCO0FBQ3BCTCxNQUFBQSxNQUFNLENBQUNFLEtBQVAsR0FBZUcsRUFBRSxDQUFDSCxLQUFsQjtBQUNBRixNQUFBQSxNQUFNLENBQUNHLE1BQVAsR0FBZ0JFLEVBQUUsQ0FBQ0YsTUFBbkI7O0FBQ0F6QywwQkFBSUMsUUFBSixDQUFhO0FBQUNDLFFBQUFBLE1BQU0sRUFBRSxpQkFBVDtBQUE0Qm9DLFFBQUFBLE1BQU0sRUFBRUE7QUFBcEMsT0FBYjtBQUNIOztBQUVELFdBQU81RSxJQUFJLENBQUM3QyxJQUFMLENBQVUsWUFBVztBQUN4QjtBQUNBO0FBQ0E7QUFDQXlILE1BQUFBLE1BQU0sQ0FBQ00sT0FBUCxHQUFpQnpHLFVBQVUsQ0FDdkJOLFlBRHVCLEVBQ1RDLE1BRFMsRUFDRFMsSUFEQyxFQUNLbUcsVUFETCxDQUEzQjtBQUdBLGFBQU9KLE1BQU0sQ0FBQ00sT0FBUCxDQUFlL0gsSUFBZixDQUFvQixVQUFTcUIsTUFBVCxFQUFpQjtBQUN4QytGLFFBQUFBLE9BQU8sQ0FBQzFGLElBQVIsR0FBZUwsTUFBTSxDQUFDSyxJQUF0QjtBQUNBMEYsUUFBQUEsT0FBTyxDQUFDNUYsR0FBUixHQUFjSCxNQUFNLENBQUNHLEdBQXJCO0FBQ0gsT0FITSxDQUFQO0FBSUgsS0FYTSxFQVdKeEIsSUFYSSxDQVdFd0IsR0FBRCxJQUFTO0FBQ2I7QUFDQSxhQUFPd0YsVUFBUDtBQUNILEtBZE0sRUFjSmhILElBZEksQ0FjQyxZQUFXO0FBQ2YsYUFBT2dCLFlBQVksQ0FBQ2dILFdBQWIsQ0FBeUIvRyxNQUF6QixFQUFpQ21HLE9BQWpDLENBQVA7QUFDSCxLQWhCTSxFQWdCSixVQUFTYSxHQUFULEVBQWM7QUFDYlQsTUFBQUEsS0FBSyxHQUFHUyxHQUFSOztBQUNBLFVBQUksQ0FBQ1IsTUFBTSxDQUFDL0UsUUFBWixFQUFzQjtBQUNsQixZQUFJd0YsSUFBSSxHQUFHLHlCQUFHLDJDQUFILEVBQWdEO0FBQUNSLFVBQUFBLFFBQVEsRUFBRUQsTUFBTSxDQUFDQztBQUFsQixTQUFoRCxDQUFYOztBQUNBLFlBQUlPLEdBQUcsQ0FBQ0UsV0FBSixJQUFtQixHQUF2QixFQUE0QjtBQUN4QkQsVUFBQUEsSUFBSSxHQUFHLHlCQUNILDBFQURHLEVBRUg7QUFBQ1IsWUFBQUEsUUFBUSxFQUFFRCxNQUFNLENBQUNDO0FBQWxCLFdBRkcsQ0FBUDtBQUlIOztBQUNELGNBQU1VLFdBQVcsR0FBR3pDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixxQkFBakIsQ0FBcEI7O0FBQ0FFLHVCQUFNQyxtQkFBTixDQUEwQixlQUExQixFQUEyQyxFQUEzQyxFQUErQ3FDLFdBQS9DLEVBQTREO0FBQ3hEcEMsVUFBQUEsS0FBSyxFQUFFLHlCQUFHLGVBQUgsQ0FEaUQ7QUFFeERDLFVBQUFBLFdBQVcsRUFBRWlDO0FBRjJDLFNBQTVEO0FBSUg7QUFDSixLQWhDTSxFQWdDSkcsT0FoQ0ksQ0FnQ0ksTUFBTTtBQUNiLFlBQU1DLGNBQWMsR0FBR0MsTUFBTSxDQUFDQyxJQUFQLENBQVksS0FBSzNFLFVBQWpCLENBQXZCOztBQUNBLFdBQUssSUFBSWhELENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUcsS0FBS2dELFVBQUwsQ0FBZ0JwRCxNQUFwQyxFQUE0QyxFQUFFSSxDQUE5QyxFQUFpRDtBQUM3QyxjQUFNNEgsQ0FBQyxHQUFHSCxjQUFjLENBQUN6SCxDQUFELENBQXhCOztBQUNBLFlBQUksS0FBS2dELFVBQUwsQ0FBZ0I0RSxDQUFoQixFQUFtQlYsT0FBbkIsS0FBK0JOLE1BQU0sQ0FBQ00sT0FBMUMsRUFBbUQ7QUFDL0MsZUFBS2xFLFVBQUwsQ0FBZ0I2RSxNQUFoQixDQUF1QkQsQ0FBdkIsRUFBMEIsQ0FBMUI7QUFDQTtBQUNIO0FBQ0o7O0FBQ0QsVUFBSWpCLEtBQUosRUFBVztBQUNQO0FBQ0E7QUFDQTtBQUNBLFlBQUlBLEtBQUssSUFBSUEsS0FBSyxDQUFDVyxXQUFOLEtBQXNCLEdBQW5DLEVBQXdDO0FBQ3BDLGVBQUtwRSxZQUFMLEdBQW9CLElBQXBCO0FBQ0g7O0FBQ0RvQiw0QkFBSUMsUUFBSixDQUFhO0FBQUNDLFVBQUFBLE1BQU0sRUFBRSxlQUFUO0FBQTBCb0MsVUFBQUEsTUFBMUI7QUFBa0NELFVBQUFBO0FBQWxDLFNBQWI7QUFDSCxPQVJELE1BUU87QUFDSHJDLDRCQUFJQyxRQUFKLENBQWE7QUFBQ0MsVUFBQUEsTUFBTSxFQUFFLGlCQUFUO0FBQTRCb0MsVUFBQUE7QUFBNUIsU0FBYjs7QUFDQXRDLDRCQUFJQyxRQUFKLENBQWE7QUFBQ0MsVUFBQUEsTUFBTSxFQUFFO0FBQVQsU0FBYjtBQUNIO0FBQ0osS0FyRE0sQ0FBUDtBQXNESDs7QUFFRHNELEVBQUFBLGlCQUFpQixHQUFHO0FBQ2hCLFdBQU8sS0FBSzlFLFVBQUwsQ0FBZ0IrRSxNQUFoQixDQUF1QkMsQ0FBQyxJQUFJLENBQUNBLENBQUMsQ0FBQ25HLFFBQS9CLENBQVA7QUFDSDs7QUFFRGMsRUFBQUEsWUFBWSxDQUFDdUUsT0FBRCxFQUFVO0FBQ2xCLFVBQU1PLGNBQWMsR0FBR0MsTUFBTSxDQUFDQyxJQUFQLENBQVksS0FBSzNFLFVBQWpCLENBQXZCO0FBQ0EsUUFBSTRELE1BQUo7O0FBQ0EsU0FBSyxJQUFJNUcsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxLQUFLZ0QsVUFBTCxDQUFnQnBELE1BQXBDLEVBQTRDLEVBQUVJLENBQTlDLEVBQWlEO0FBQzdDLFlBQU00SCxDQUFDLEdBQUdILGNBQWMsQ0FBQ3pILENBQUQsQ0FBeEI7O0FBQ0EsVUFBSSxLQUFLZ0QsVUFBTCxDQUFnQjRFLENBQWhCLEVBQW1CVixPQUFuQixLQUErQkEsT0FBbkMsRUFBNEM7QUFDeENOLFFBQUFBLE1BQU0sR0FBRyxLQUFLNUQsVUFBTCxDQUFnQjRFLENBQWhCLENBQVQ7QUFDQTtBQUNIO0FBQ0o7O0FBQ0QsUUFBSWhCLE1BQUosRUFBWTtBQUNSQSxNQUFBQSxNQUFNLENBQUMvRSxRQUFQLEdBQWtCLElBQWxCOztBQUNBWSx1Q0FBZ0JDLEdBQWhCLEdBQXNCQyxZQUF0QixDQUFtQ2lFLE1BQU0sQ0FBQ00sT0FBMUM7O0FBQ0E1QywwQkFBSUMsUUFBSixDQUFhO0FBQUNDLFFBQUFBLE1BQU0sRUFBRSxpQkFBVDtBQUE0Qm9DLFFBQUFBO0FBQTVCLE9BQWI7QUFDSDtBQUNKOztBQW5SZ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgZXh0ZW5kIGZyb20gJy4vZXh0ZW5kJztcbmltcG9ydCBkaXMgZnJvbSAnLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXInO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuL2luZGV4JztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IE1vZGFsIGZyb20gJy4vTW9kYWwnO1xuaW1wb3J0IFJvb21WaWV3U3RvcmUgZnJvbSAnLi9zdG9yZXMvUm9vbVZpZXdTdG9yZSc7XG5pbXBvcnQgZW5jcnlwdCBmcm9tIFwiYnJvd3Nlci1lbmNyeXB0LWF0dGFjaG1lbnRcIjtcbmltcG9ydCBleHRyYWN0UG5nQ2h1bmtzIGZyb20gXCJwbmctY2h1bmtzLWV4dHJhY3RcIjtcblxuLy8gUG9seWZpbGwgZm9yIENhbnZhcy50b0Jsb2IgQVBJIHVzaW5nIENhbnZhcy50b0RhdGFVUkxcbmltcG9ydCBcImJsdWVpbXAtY2FudmFzLXRvLWJsb2JcIjtcblxuY29uc3QgTUFYX1dJRFRIID0gODAwO1xuY29uc3QgTUFYX0hFSUdIVCA9IDYwMDtcblxuLy8gc2NyYXBlZCBvdXQgb2YgYSBtYWNPUyBoaWRwaSAoNTY2MHBwbSkgc2NyZWVuc2hvdCBwbmdcbi8vICAgICAgICAgICAgICAgICAgNTY2OSBweCAoeC1heGlzKSAgICAgICwgNTY2OSBweCAoeS1heGlzKSAgICAgICwgcGVyIG1ldHJlXG5jb25zdCBQSFlTX0hJRFBJID0gWzB4MDAsIDB4MDAsIDB4MTYsIDB4MjUsIDB4MDAsIDB4MDAsIDB4MTYsIDB4MjUsIDB4MDFdO1xuXG5leHBvcnQgY2xhc3MgVXBsb2FkQ2FuY2VsZWRFcnJvciBleHRlbmRzIEVycm9yIHt9XG5cbi8qKlxuICogQ3JlYXRlIGEgdGh1bWJuYWlsIGZvciBhIGltYWdlIERPTSBlbGVtZW50LlxuICogVGhlIGltYWdlIHdpbGwgYmUgc21hbGxlciB0aGFuIE1BWF9XSURUSCBhbmQgTUFYX0hFSUdIVC5cbiAqIFRoZSB0aHVtYm5haWwgd2lsbCBoYXZlIHRoZSBzYW1lIGFzcGVjdCByYXRpbyBhcyB0aGUgb3JpZ2luYWwuXG4gKiBEcmF3cyB0aGUgZWxlbWVudCBpbnRvIGEgY2FudmFzIHVzaW5nIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC5kcmF3SW1hZ2VcbiAqIFRoZW4gY2FsbHMgQ2FudmFzLnRvQmxvYiB0byBnZXQgYSBibG9iIG9iamVjdCBmb3IgdGhlIGltYWdlIGRhdGEuXG4gKlxuICogU2luY2UgaXQgbmVlZHMgdG8gY2FsY3VsYXRlIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBzb3VyY2UgaW1hZ2UgYW5kIHRoZVxuICogdGh1bWJuYWlsZWQgaW1hZ2UgaXQgcmV0dXJucyBhbiBpbmZvIG9iamVjdCBmaWxsZWQgb3V0IHdpdGggaW5mb3JtYXRpb25cbiAqIGFib3V0IHRoZSBvcmlnaW5hbCBpbWFnZSBhbmQgdGhlIHRodW1ibmFpbC5cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHRodW1ibmFpbC5cbiAqIEBwYXJhbSB7aW50ZWdlcn0gaW5wdXRXaWR0aCBUaGUgd2lkdGggb2YgdGhlIGltYWdlIGluIHRoZSBpbnB1dCBlbGVtZW50LlxuICogQHBhcmFtIHtpbnRlZ2VyfSBpbnB1dEhlaWdodCB0aGUgd2lkdGggb2YgdGhlIGltYWdlIGluIHRoZSBpbnB1dCBlbGVtZW50LlxuICogQHBhcmFtIHtTdHJpbmd9IG1pbWVUeXBlIFRoZSBtaW1lVHlwZSB0byBzYXZlIHRoZSBibG9iIGFzLlxuICogQHJldHVybiB7UHJvbWlzZX0gQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCBhbiBvYmplY3Qgd2l0aCBhbiBpbmZvIGtleVxuICogIGFuZCBhIHRodW1ibmFpbCBrZXkuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVRodW1ibmFpbChlbGVtZW50LCBpbnB1dFdpZHRoLCBpbnB1dEhlaWdodCwgbWltZVR5cGUpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgbGV0IHRhcmdldFdpZHRoID0gaW5wdXRXaWR0aDtcbiAgICAgICAgbGV0IHRhcmdldEhlaWdodCA9IGlucHV0SGVpZ2h0O1xuICAgICAgICBpZiAodGFyZ2V0SGVpZ2h0ID4gTUFYX0hFSUdIVCkge1xuICAgICAgICAgICAgdGFyZ2V0V2lkdGggPSBNYXRoLmZsb29yKHRhcmdldFdpZHRoICogKE1BWF9IRUlHSFQgLyB0YXJnZXRIZWlnaHQpKTtcbiAgICAgICAgICAgIHRhcmdldEhlaWdodCA9IE1BWF9IRUlHSFQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRhcmdldFdpZHRoID4gTUFYX1dJRFRIKSB7XG4gICAgICAgICAgICB0YXJnZXRIZWlnaHQgPSBNYXRoLmZsb29yKHRhcmdldEhlaWdodCAqIChNQVhfV0lEVEggLyB0YXJnZXRXaWR0aCkpO1xuICAgICAgICAgICAgdGFyZ2V0V2lkdGggPSBNQVhfV0lEVEg7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuICAgICAgICBjYW52YXMud2lkdGggPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IHRhcmdldEhlaWdodDtcbiAgICAgICAgY2FudmFzLmdldENvbnRleHQoXCIyZFwiKS5kcmF3SW1hZ2UoZWxlbWVudCwgMCwgMCwgdGFyZ2V0V2lkdGgsIHRhcmdldEhlaWdodCk7XG4gICAgICAgIGNhbnZhcy50b0Jsb2IoZnVuY3Rpb24odGh1bWJuYWlsKSB7XG4gICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICBpbmZvOiB7XG4gICAgICAgICAgICAgICAgICAgIHRodW1ibmFpbF9pbmZvOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3OiB0YXJnZXRXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGg6IHRhcmdldEhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbWV0eXBlOiB0aHVtYm5haWwudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IHRodW1ibmFpbC5zaXplLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB3OiBpbnB1dFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICBoOiBpbnB1dEhlaWdodCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHRodW1ibmFpbDogdGh1bWJuYWlsLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIG1pbWVUeXBlKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBMb2FkIGEgZmlsZSBpbnRvIGEgbmV3bHkgY3JlYXRlZCBpbWFnZSBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSB7RmlsZX0gaW1hZ2VGaWxlIFRoZSBmaWxlIHRvIGxvYWQgaW4gYW4gaW1hZ2UgZWxlbWVudC5cbiAqIEByZXR1cm4ge1Byb21pc2V9IEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIGh0bWwgaW1hZ2UgZWxlbWVudC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZEltYWdlRWxlbWVudChpbWFnZUZpbGUpIHtcbiAgICAvLyBMb2FkIHRoZSBmaWxlIGludG8gYW4gaHRtbCBlbGVtZW50XG4gICAgY29uc3QgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcbiAgICBjb25zdCBvYmplY3RVcmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGltYWdlRmlsZSk7XG4gICAgY29uc3QgaW1nUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChvYmplY3RVcmwpO1xuICAgICAgICAgICAgcmVzb2x2ZShpbWcpO1xuICAgICAgICB9O1xuICAgICAgICBpbWcub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICBpbWcuc3JjID0gb2JqZWN0VXJsO1xuXG4gICAgLy8gY2hlY2sgZm9yIGhpLWRwaSBQTkdzIGFuZCBmdWRnZSBkaXNwbGF5IHJlc29sdXRpb24gYXMgbmVlZGVkLlxuICAgIC8vIHRoaXMgaXMgbWFpbmx5IG5lZWRlZCBmb3IgbWFjT1Mgc2NyZWVuY2Fwc1xuICAgIGxldCBwYXJzZVByb21pc2U7XG4gICAgaWYgKGltYWdlRmlsZS50eXBlID09PSBcImltYWdlL3BuZ1wiKSB7XG4gICAgICAgIC8vIGluIHByYWN0aWNlIG1hY09TIGhhcHBlbnMgdG8gb3JkZXIgdGhlIGNodW5rcyBzbyB0aGV5IGZhbGwgaW5cbiAgICAgICAgLy8gdGhlIGZpcnN0IDB4MTAwMCBieXRlcyAodGhhbmtzIHRvIGEgbWFzc2l2ZSBJQ0MgaGVhZGVyKS5cbiAgICAgICAgLy8gVGh1cyB3ZSBjb3VsZCBzbGljZSB0aGUgZmlsZSBkb3duIHRvIG9ubHkgc25pZmYgdGhlIGZpcnN0IDB4MTAwMFxuICAgICAgICAvLyBieXRlcyAoYnV0IHRoaXMgbWFrZXMgZXh0cmFjdFBuZ0NodW5rcyBjaG9rZSBvbiB0aGUgY29ycnVwdCBmaWxlKVxuICAgICAgICBjb25zdCBoZWFkZXJzID0gaW1hZ2VGaWxlOyAvLy5zbGljZSgwLCAweDEwMDApO1xuICAgICAgICBwYXJzZVByb21pc2UgPSByZWFkRmlsZUFzQXJyYXlCdWZmZXIoaGVhZGVycykudGhlbihhcnJheUJ1ZmZlciA9PiB7XG4gICAgICAgICAgICBjb25zdCBidWZmZXIgPSBuZXcgVWludDhBcnJheShhcnJheUJ1ZmZlcik7XG4gICAgICAgICAgICBjb25zdCBjaHVua3MgPSBleHRyYWN0UG5nQ2h1bmtzKGJ1ZmZlcik7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNodW5rIG9mIGNodW5rcykge1xuICAgICAgICAgICAgICAgIGlmIChjaHVuay5uYW1lID09PSAncEhZcycpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNodW5rLmRhdGEuYnl0ZUxlbmd0aCAhPT0gUEhZU19ISURQSS5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGlkcGkgPSBjaHVuay5kYXRhLmV2ZXJ5KCh2YWwsIGkpID0+IHZhbCA9PT0gUEhZU19ISURQSVtpXSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBoaWRwaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IFtoaWRwaV0gPSBhd2FpdCBQcm9taXNlLmFsbChbcGFyc2VQcm9taXNlLCBpbWdQcm9taXNlXSk7XG4gICAgY29uc3Qgd2lkdGggPSBoaWRwaSA/IChpbWcud2lkdGggPj4gMSkgOiBpbWcud2lkdGg7XG4gICAgY29uc3QgaGVpZ2h0ID0gaGlkcGkgPyAoaW1nLmhlaWdodCA+PiAxKSA6IGltZy5oZWlnaHQ7XG4gICAgcmV0dXJuIHt3aWR0aCwgaGVpZ2h0LCBpbWd9O1xufVxuXG4vKipcbiAqIFJlYWQgdGhlIG1ldGFkYXRhIGZvciBhbiBpbWFnZSBmaWxlIGFuZCBjcmVhdGUgYW5kIHVwbG9hZCBhIHRodW1ibmFpbCBvZiB0aGUgaW1hZ2UuXG4gKlxuICogQHBhcmFtIHtNYXRyaXhDbGllbnR9IG1hdHJpeENsaWVudCBBIG1hdHJpeENsaWVudCB0byB1cGxvYWQgdGhlIHRodW1ibmFpbCB3aXRoLlxuICogQHBhcmFtIHtTdHJpbmd9IHJvb21JZCBUaGUgSUQgb2YgdGhlIHJvb20gdGhlIGltYWdlIHdpbGwgYmUgdXBsb2FkZWQgaW4uXG4gKiBAcGFyYW0ge0ZpbGV9IGltYWdlRmlsZSBUaGUgaW1hZ2UgdG8gcmVhZCBhbmQgdGh1bWJuYWlsLlxuICogQHJldHVybiB7UHJvbWlzZX0gQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCB0aGUgYXR0YWNobWVudCBpbmZvLlxuICovXG5mdW5jdGlvbiBpbmZvRm9ySW1hZ2VGaWxlKG1hdHJpeENsaWVudCwgcm9vbUlkLCBpbWFnZUZpbGUpIHtcbiAgICBsZXQgdGh1bWJuYWlsVHlwZSA9IFwiaW1hZ2UvcG5nXCI7XG4gICAgaWYgKGltYWdlRmlsZS50eXBlID09IFwiaW1hZ2UvanBlZ1wiKSB7XG4gICAgICAgIHRodW1ibmFpbFR5cGUgPSBcImltYWdlL2pwZWdcIjtcbiAgICB9XG5cbiAgICBsZXQgaW1hZ2VJbmZvO1xuICAgIHJldHVybiBsb2FkSW1hZ2VFbGVtZW50KGltYWdlRmlsZSkudGhlbihmdW5jdGlvbihyKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVUaHVtYm5haWwoci5pbWcsIHIud2lkdGgsIHIuaGVpZ2h0LCB0aHVtYm5haWxUeXBlKTtcbiAgICB9KS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICBpbWFnZUluZm8gPSByZXN1bHQuaW5mbztcbiAgICAgICAgcmV0dXJuIHVwbG9hZEZpbGUobWF0cml4Q2xpZW50LCByb29tSWQsIHJlc3VsdC50aHVtYm5haWwpO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIGltYWdlSW5mby50aHVtYm5haWxfdXJsID0gcmVzdWx0LnVybDtcbiAgICAgICAgaW1hZ2VJbmZvLnRodW1ibmFpbF9maWxlID0gcmVzdWx0LmZpbGU7XG4gICAgICAgIHJldHVybiBpbWFnZUluZm87XG4gICAgfSk7XG59XG5cbi8qKlxuICogTG9hZCBhIGZpbGUgaW50byBhIG5ld2x5IGNyZWF0ZWQgdmlkZW8gZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0ge0ZpbGV9IHZpZGVvRmlsZSBUaGUgZmlsZSB0byBsb2FkIGluIGFuIHZpZGVvIGVsZW1lbnQuXG4gKiBAcmV0dXJuIHtQcm9taXNlfSBBIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSB2aWRlbyBpbWFnZSBlbGVtZW50LlxuICovXG5mdW5jdGlvbiBsb2FkVmlkZW9FbGVtZW50KHZpZGVvRmlsZSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIC8vIExvYWQgdGhlIGZpbGUgaW50byBhbiBodG1sIGVsZW1lbnRcbiAgICAgICAgY29uc3QgdmlkZW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidmlkZW9cIik7XG5cbiAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblxuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmlkZW8uc3JjID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICAgICAgICAvLyBPbmNlIHJlYWR5LCByZXR1cm5zIGl0cyBzaXplXG4gICAgICAgICAgICAvLyBXYWl0IHVudGlsIHdlIGhhdmUgZW5vdWdoIGRhdGEgdG8gdGh1bWJuYWlsIHRoZSBmaXJzdCBmcmFtZS5cbiAgICAgICAgICAgIHZpZGVvLm9ubG9hZGVkZGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodmlkZW8pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZpZGVvLm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKHZpZGVvRmlsZSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogUmVhZCB0aGUgbWV0YWRhdGEgZm9yIGEgdmlkZW8gZmlsZSBhbmQgY3JlYXRlIGFuZCB1cGxvYWQgYSB0aHVtYm5haWwgb2YgdGhlIHZpZGVvLlxuICpcbiAqIEBwYXJhbSB7TWF0cml4Q2xpZW50fSBtYXRyaXhDbGllbnQgQSBtYXRyaXhDbGllbnQgdG8gdXBsb2FkIHRoZSB0aHVtYm5haWwgd2l0aC5cbiAqIEBwYXJhbSB7U3RyaW5nfSByb29tSWQgVGhlIElEIG9mIHRoZSByb29tIHRoZSB2aWRlbyB3aWxsIGJlIHVwbG9hZGVkIHRvLlxuICogQHBhcmFtIHtGaWxlfSB2aWRlb0ZpbGUgVGhlIHZpZGVvIHRvIHJlYWQgYW5kIHRodW1ibmFpbC5cbiAqIEByZXR1cm4ge1Byb21pc2V9IEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIGF0dGFjaG1lbnQgaW5mby5cbiAqL1xuZnVuY3Rpb24gaW5mb0ZvclZpZGVvRmlsZShtYXRyaXhDbGllbnQsIHJvb21JZCwgdmlkZW9GaWxlKSB7XG4gICAgY29uc3QgdGh1bWJuYWlsVHlwZSA9IFwiaW1hZ2UvanBlZ1wiO1xuXG4gICAgbGV0IHZpZGVvSW5mbztcbiAgICByZXR1cm4gbG9hZFZpZGVvRWxlbWVudCh2aWRlb0ZpbGUpLnRoZW4oZnVuY3Rpb24odmlkZW8pIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVRodW1ibmFpbCh2aWRlbywgdmlkZW8udmlkZW9XaWR0aCwgdmlkZW8udmlkZW9IZWlnaHQsIHRodW1ibmFpbFR5cGUpO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIHZpZGVvSW5mbyA9IHJlc3VsdC5pbmZvO1xuICAgICAgICByZXR1cm4gdXBsb2FkRmlsZShtYXRyaXhDbGllbnQsIHJvb21JZCwgcmVzdWx0LnRodW1ibmFpbCk7XG4gICAgfSkudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgdmlkZW9JbmZvLnRodW1ibmFpbF91cmwgPSByZXN1bHQudXJsO1xuICAgICAgICB2aWRlb0luZm8udGh1bWJuYWlsX2ZpbGUgPSByZXN1bHQuZmlsZTtcbiAgICAgICAgcmV0dXJuIHZpZGVvSW5mbztcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBSZWFkIHRoZSBmaWxlIGFzIGFuIEFycmF5QnVmZmVyLlxuICogQHBhcmFtIHtGaWxlfSBmaWxlIFRoZSBmaWxlIHRvIHJlYWRcbiAqIEByZXR1cm4ge1Byb21pc2V9IEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggYW4gQXJyYXlCdWZmZXIgd2hlbiB0aGUgZmlsZVxuICogICBpcyByZWFkLlxuICovXG5mdW5jdGlvbiByZWFkRmlsZUFzQXJyYXlCdWZmZXIoZmlsZSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICByZXNvbHZlKGUudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoZmlsZSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogVXBsb2FkIHRoZSBmaWxlIHRvIHRoZSBjb250ZW50IHJlcG9zaXRvcnkuXG4gKiBJZiB0aGUgcm9vbSBpcyBlbmNyeXB0ZWQgdGhlbiBlbmNyeXB0IHRoZSBmaWxlIGJlZm9yZSB1cGxvYWRpbmcuXG4gKlxuICogQHBhcmFtIHtNYXRyaXhDbGllbnR9IG1hdHJpeENsaWVudCBUaGUgbWF0cml4IGNsaWVudCB0byB1cGxvYWQgdGhlIGZpbGUgd2l0aC5cbiAqIEBwYXJhbSB7U3RyaW5nfSByb29tSWQgVGhlIElEIG9mIHRoZSByb29tIGJlaW5nIHVwbG9hZGVkIHRvLlxuICogQHBhcmFtIHtGaWxlfSBmaWxlIFRoZSBmaWxlIHRvIHVwbG9hZC5cbiAqIEBwYXJhbSB7RnVuY3Rpb24/fSBwcm9ncmVzc0hhbmRsZXIgb3B0aW9uYWwgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYSBjaHVuayBvZlxuICogICAgZGF0YSBpcyB1cGxvYWRlZC5cbiAqIEByZXR1cm4ge1Byb21pc2V9IEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggYW4gb2JqZWN0LlxuICogIElmIHRoZSBmaWxlIGlzIHVuZW5jcnlwdGVkIHRoZW4gdGhlIG9iamVjdCB3aWxsIGhhdmUgYSBcInVybFwiIGtleS5cbiAqICBJZiB0aGUgZmlsZSBpcyBlbmNyeXB0ZWQgdGhlbiB0aGUgb2JqZWN0IHdpbGwgaGF2ZSBhIFwiZmlsZVwiIGtleS5cbiAqL1xuZnVuY3Rpb24gdXBsb2FkRmlsZShtYXRyaXhDbGllbnQsIHJvb21JZCwgZmlsZSwgcHJvZ3Jlc3NIYW5kbGVyKSB7XG4gICAgaWYgKG1hdHJpeENsaWVudC5pc1Jvb21FbmNyeXB0ZWQocm9vbUlkKSkge1xuICAgICAgICAvLyBJZiB0aGUgcm9vbSBpcyBlbmNyeXB0ZWQgdGhlbiBlbmNyeXB0IHRoZSBmaWxlIGJlZm9yZSB1cGxvYWRpbmcgaXQuXG4gICAgICAgIC8vIEZpcnN0IHJlYWQgdGhlIGZpbGUgaW50byBtZW1vcnkuXG4gICAgICAgIGxldCBjYW5jZWxlZCA9IGZhbHNlO1xuICAgICAgICBsZXQgdXBsb2FkUHJvbWlzZTtcbiAgICAgICAgbGV0IGVuY3J5cHRJbmZvO1xuICAgICAgICBjb25zdCBwcm9tID0gcmVhZEZpbGVBc0FycmF5QnVmZmVyKGZpbGUpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgaWYgKGNhbmNlbGVkKSB0aHJvdyBuZXcgVXBsb2FkQ2FuY2VsZWRFcnJvcigpO1xuICAgICAgICAgICAgLy8gVGhlbiBlbmNyeXB0IHRoZSBmaWxlLlxuICAgICAgICAgICAgcmV0dXJuIGVuY3J5cHQuZW5jcnlwdEF0dGFjaG1lbnQoZGF0YSk7XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24oZW5jcnlwdFJlc3VsdCkge1xuICAgICAgICAgICAgaWYgKGNhbmNlbGVkKSB0aHJvdyBuZXcgVXBsb2FkQ2FuY2VsZWRFcnJvcigpO1xuICAgICAgICAgICAgLy8gUmVjb3JkIHRoZSBpbmZvcm1hdGlvbiBuZWVkZWQgdG8gZGVjcnlwdCB0aGUgYXR0YWNobWVudC5cbiAgICAgICAgICAgIGVuY3J5cHRJbmZvID0gZW5jcnlwdFJlc3VsdC5pbmZvO1xuICAgICAgICAgICAgLy8gUGFzcyB0aGUgZW5jcnlwdGVkIGRhdGEgYXMgYSBCbG9iIHRvIHRoZSB1cGxvYWRlci5cbiAgICAgICAgICAgIGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbZW5jcnlwdFJlc3VsdC5kYXRhXSk7XG4gICAgICAgICAgICB1cGxvYWRQcm9taXNlID0gbWF0cml4Q2xpZW50LnVwbG9hZENvbnRlbnQoYmxvYiwge1xuICAgICAgICAgICAgICAgIHByb2dyZXNzSGFuZGxlcjogcHJvZ3Jlc3NIYW5kbGVyLFxuICAgICAgICAgICAgICAgIGluY2x1ZGVGaWxlbmFtZTogZmFsc2UsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHVwbG9hZFByb21pc2U7XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24odXJsKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgYXR0YWNobWVudCBpcyBlbmNyeXB0ZWQgdGhlbiBidW5kbGUgdGhlIFVSTCBhbG9uZ1xuICAgICAgICAgICAgLy8gd2l0aCB0aGUgaW5mb3JtYXRpb24gbmVlZGVkIHRvIGRlY3J5cHQgdGhlIGF0dGFjaG1lbnQgYW5kXG4gICAgICAgICAgICAvLyBhZGQgaXQgdW5kZXIgYSBmaWxlIGtleS5cbiAgICAgICAgICAgIGVuY3J5cHRJbmZvLnVybCA9IHVybDtcbiAgICAgICAgICAgIGlmIChmaWxlLnR5cGUpIHtcbiAgICAgICAgICAgICAgICBlbmNyeXB0SW5mby5taW1ldHlwZSA9IGZpbGUudHlwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XCJmaWxlXCI6IGVuY3J5cHRJbmZvfTtcbiAgICAgICAgfSk7XG4gICAgICAgIHByb20uYWJvcnQgPSAoKSA9PiB7XG4gICAgICAgICAgICBjYW5jZWxlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAodXBsb2FkUHJvbWlzZSkgTWF0cml4Q2xpZW50UGVnLmdldCgpLmNhbmNlbFVwbG9hZCh1cGxvYWRQcm9taXNlKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHByb207XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgYmFzZVByb21pc2UgPSBtYXRyaXhDbGllbnQudXBsb2FkQ29udGVudChmaWxlLCB7XG4gICAgICAgICAgICBwcm9ncmVzc0hhbmRsZXI6IHByb2dyZXNzSGFuZGxlcixcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHByb21pc2UxID0gYmFzZVByb21pc2UudGhlbihmdW5jdGlvbih1cmwpIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSBhdHRhY2htZW50IGlzbid0IGVuY3J5cHRlZCB0aGVuIGluY2x1ZGUgdGhlIFVSTCBkaXJlY3RseS5cbiAgICAgICAgICAgIHJldHVybiB7XCJ1cmxcIjogdXJsfTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIFhYWDogY29weSBvdmVyIHRoZSBhYm9ydCBtZXRob2QgdG8gdGhlIG5ldyBwcm9taXNlXG4gICAgICAgIHByb21pc2UxLmFib3J0ID0gYmFzZVByb21pc2UuYWJvcnQ7XG4gICAgICAgIHJldHVybiBwcm9taXNlMTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbnRlbnRNZXNzYWdlcyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaW5wcm9ncmVzcyA9IFtdO1xuICAgICAgICB0aGlzLm5leHRJZCA9IDA7XG4gICAgICAgIHRoaXMuX21lZGlhQ29uZmlnID0gbnVsbDtcbiAgICB9XG5cbiAgICBzdGF0aWMgc2hhcmVkSW5zdGFuY2UoKSB7XG4gICAgICAgIGlmIChnbG9iYWwubXhfQ29udGVudE1lc3NhZ2VzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGdsb2JhbC5teF9Db250ZW50TWVzc2FnZXMgPSBuZXcgQ29udGVudE1lc3NhZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdsb2JhbC5teF9Db250ZW50TWVzc2FnZXM7XG4gICAgfVxuXG4gICAgX2lzRmlsZVNpemVBY2NlcHRhYmxlKGZpbGUpIHtcbiAgICAgICAgaWYgKHRoaXMuX21lZGlhQ29uZmlnICE9PSBudWxsICYmXG4gICAgICAgICAgICB0aGlzLl9tZWRpYUNvbmZpZ1tcIm0udXBsb2FkLnNpemVcIl0gIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgZmlsZS5zaXplID4gdGhpcy5fbWVkaWFDb25maWdbXCJtLnVwbG9hZC5zaXplXCJdKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgX2Vuc3VyZU1lZGlhQ29uZmlnRmV0Y2hlZCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX21lZGlhQ29uZmlnICE9PSBudWxsKSByZXR1cm47XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJbTWVkaWEgQ29uZmlnXSBGZXRjaGluZ1wiKTtcbiAgICAgICAgcmV0dXJuIE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRNZWRpYUNvbmZpZygpLnRoZW4oKGNvbmZpZykgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJbTWVkaWEgQ29uZmlnXSBGZXRjaGVkIGNvbmZpZzpcIiwgY29uZmlnKTtcbiAgICAgICAgICAgIHJldHVybiBjb25maWc7XG4gICAgICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgICAgICAgIC8vIE1lZGlhIHJlcG8gY2FuJ3Qgb3Igd29uJ3QgcmVwb3J0IGxpbWl0cywgc28gcHJvdmlkZSBhbiBlbXB0eSBvYmplY3QgKG5vIGxpbWl0cykuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIltNZWRpYSBDb25maWddIENvdWxkIG5vdCBmZXRjaCBjb25maWcsIHNvIG5vdCBsaW1pdGluZyB1cGxvYWRzLlwiKTtcbiAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgfSkudGhlbigoY29uZmlnKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9tZWRpYUNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2VuZFN0aWNrZXJDb250ZW50VG9Sb29tKHVybCwgcm9vbUlkLCBpbmZvLCB0ZXh0LCBtYXRyaXhDbGllbnQpIHtcbiAgICAgICAgcmV0dXJuIE1hdHJpeENsaWVudFBlZy5nZXQoKS5zZW5kU3RpY2tlck1lc3NhZ2Uocm9vbUlkLCB1cmwsIGluZm8sIHRleHQpLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEZhaWxlZCB0byBzZW5kIGNvbnRlbnQgd2l0aCBVUkwgJHt1cmx9IHRvIHJvb20gJHtyb29tSWR9YCwgZSk7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXRVcGxvYWRMaW1pdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX21lZGlhQ29uZmlnICE9PSBudWxsICYmIHRoaXMuX21lZGlhQ29uZmlnW1wibS51cGxvYWQuc2l6ZVwiXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbWVkaWFDb25maWdbXCJtLnVwbG9hZC5zaXplXCJdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBzZW5kQ29udGVudExpc3RUb1Jvb20oZmlsZXMsIHJvb21JZCwgbWF0cml4Q2xpZW50KSB7XG4gICAgICAgIGlmIChtYXRyaXhDbGllbnQuaXNHdWVzdCgpKSB7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ3JlcXVpcmVfcmVnaXN0cmF0aW9uJ30pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXNRdW90aW5nID0gQm9vbGVhbihSb29tVmlld1N0b3JlLmdldFF1b3RpbmdFdmVudCgpKTtcbiAgICAgICAgaWYgKGlzUXVvdGluZykge1xuICAgICAgICAgICAgY29uc3QgUXVlc3Rpb25EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5RdWVzdGlvbkRpYWxvZ1wiKTtcbiAgICAgICAgICAgIGNvbnN0IHNob3VsZFVwbG9hZCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnVXBsb2FkIFJlcGx5IFdhcm5pbmcnLCAnJywgUXVlc3Rpb25EaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KCdSZXBseWluZyBXaXRoIEZpbGVzJyksXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PntfdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnQXQgdGhpcyB0aW1lIGl0IGlzIG5vdCBwb3NzaWJsZSB0byByZXBseSB3aXRoIGEgZmlsZS4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1dvdWxkIHlvdSBsaWtlIHRvIHVwbG9hZCB0aGlzIGZpbGUgd2l0aG91dCByZXBseWluZz8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgKX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgICAgaGFzQ2FuY2VsQnV0dG9uOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBidXR0b246IF90KFwiQ29udGludWVcIiksXG4gICAgICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ6IChzaG91bGRVcGxvYWQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc2hvdWxkVXBsb2FkKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKCFzaG91bGRVcGxvYWQpIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuX2Vuc3VyZU1lZGlhQ29uZmlnRmV0Y2hlZCgpO1xuXG4gICAgICAgIGNvbnN0IHRvb0JpZ0ZpbGVzID0gW107XG4gICAgICAgIGNvbnN0IG9rRmlsZXMgPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNGaWxlU2l6ZUFjY2VwdGFibGUoZmlsZXNbaV0pKSB7XG4gICAgICAgICAgICAgICAgb2tGaWxlcy5wdXNoKGZpbGVzW2ldKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdG9vQmlnRmlsZXMucHVzaChmaWxlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodG9vQmlnRmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgVXBsb2FkRmFpbHVyZURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLlVwbG9hZEZhaWx1cmVEaWFsb2dcIik7XG4gICAgICAgICAgICBjb25zdCB1cGxvYWRGYWlsdXJlRGlhbG9nUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnVXBsb2FkIEZhaWx1cmUnLCAnJywgVXBsb2FkRmFpbHVyZURpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICBiYWRGaWxlczogdG9vQmlnRmlsZXMsXG4gICAgICAgICAgICAgICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudE1lc3NhZ2VzOiB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBvbkZpbmlzaGVkOiAoc2hvdWxkQ29udGludWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc2hvdWxkQ29udGludWUpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBzaG91bGRDb250aW51ZSA9IGF3YWl0IHVwbG9hZEZhaWx1cmVEaWFsb2dQcm9taXNlO1xuICAgICAgICAgICAgaWYgKCFzaG91bGRDb250aW51ZSkgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgVXBsb2FkQ29uZmlybURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLlVwbG9hZENvbmZpcm1EaWFsb2dcIik7XG4gICAgICAgIGxldCB1cGxvYWRBbGwgPSBmYWxzZTtcbiAgICAgICAgLy8gUHJvbWlzZSB0byBjb21wbGV0ZSBiZWZvcmUgc2VuZGluZyBuZXh0IGZpbGUgaW50byByb29tLCB1c2VkIGZvciBzeW5jaHJvbmlzYXRpb24gb2YgZmlsZS1zZW5kaW5nXG4gICAgICAgIC8vIHRvIG1hdGNoIHRoZSBvcmRlciB0aGUgZmlsZXMgd2VyZSBzcGVjaWZpZWQgaW5cbiAgICAgICAgbGV0IHByb21CZWZvcmUgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBva0ZpbGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBjb25zdCBmaWxlID0gb2tGaWxlc1tpXTtcbiAgICAgICAgICAgIGlmICghdXBsb2FkQWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2hvdWxkQ29udGludWUgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdVcGxvYWQgRmlsZXMgY29uZmlybWF0aW9uJywgJycsIFVwbG9hZENvbmZpcm1EaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50SW5kZXg6IGksXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3RhbEZpbGVzOiBva0ZpbGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ6IChzaG91bGRDb250aW51ZSwgc2hvdWxkVXBsb2FkQWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZFVwbG9hZEFsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGxvYWRBbGwgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHNob3VsZENvbnRpbnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmICghc2hvdWxkQ29udGludWUpIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJvbUJlZm9yZSA9IHRoaXMuX3NlbmRDb250ZW50VG9Sb29tKGZpbGUsIHJvb21JZCwgbWF0cml4Q2xpZW50LCBwcm9tQmVmb3JlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9zZW5kQ29udGVudFRvUm9vbShmaWxlLCByb29tSWQsIG1hdHJpeENsaWVudCwgcHJvbUJlZm9yZSkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0ge1xuICAgICAgICAgICAgYm9keTogZmlsZS5uYW1lIHx8ICdBdHRhY2htZW50JyxcbiAgICAgICAgICAgIGluZm86IHtcbiAgICAgICAgICAgICAgICBzaXplOiBmaWxlLnNpemUsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGlmIHdlIGhhdmUgYSBtaW1lIHR5cGUgZm9yIHRoZSBmaWxlLCBhZGQgaXQgdG8gdGhlIG1lc3NhZ2UgbWV0YWRhdGFcbiAgICAgICAgaWYgKGZpbGUudHlwZSkge1xuICAgICAgICAgICAgY29udGVudC5pbmZvLm1pbWV0eXBlID0gZmlsZS50eXBlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJvbSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBpZiAoZmlsZS50eXBlLmluZGV4T2YoJ2ltYWdlLycpID09IDApIHtcbiAgICAgICAgICAgICAgICBjb250ZW50Lm1zZ3R5cGUgPSAnbS5pbWFnZSc7XG4gICAgICAgICAgICAgICAgaW5mb0ZvckltYWdlRmlsZShtYXRyaXhDbGllbnQsIHJvb21JZCwgZmlsZSkudGhlbigoaW1hZ2VJbmZvKT0+e1xuICAgICAgICAgICAgICAgICAgICBleHRlbmQoY29udGVudC5pbmZvLCBpbWFnZUluZm8pO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSwgKGVycm9yKT0+e1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5tc2d0eXBlID0gJ20uZmlsZSc7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlsZS50eXBlLmluZGV4T2YoJ2F1ZGlvLycpID09IDApIHtcbiAgICAgICAgICAgICAgICBjb250ZW50Lm1zZ3R5cGUgPSAnbS5hdWRpbyc7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlLnR5cGUuaW5kZXhPZigndmlkZW8vJykgPT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnRlbnQubXNndHlwZSA9ICdtLnZpZGVvJztcbiAgICAgICAgICAgICAgICBpbmZvRm9yVmlkZW9GaWxlKG1hdHJpeENsaWVudCwgcm9vbUlkLCBmaWxlKS50aGVuKCh2aWRlb0luZm8pPT57XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuZChjb250ZW50LmluZm8sIHZpZGVvSW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9LCAoZXJyb3IpPT57XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQubXNndHlwZSA9ICdtLmZpbGUnO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnRlbnQubXNndHlwZSA9ICdtLmZpbGUnO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgdXBsb2FkID0ge1xuICAgICAgICAgICAgZmlsZU5hbWU6IGZpbGUubmFtZSB8fCAnQXR0YWNobWVudCcsXG4gICAgICAgICAgICByb29tSWQ6IHJvb21JZCxcbiAgICAgICAgICAgIHRvdGFsOiAwLFxuICAgICAgICAgICAgbG9hZGVkOiAwLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmlucHJvZ3Jlc3MucHVzaCh1cGxvYWQpO1xuICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ3VwbG9hZF9zdGFydGVkJ30pO1xuXG4gICAgICAgIC8vIEZvY3VzIHRoZSBjb21wb3NlciB2aWV3XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAnZm9jdXNfY29tcG9zZXInfSk7XG5cbiAgICAgICAgbGV0IGVycm9yO1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uUHJvZ3Jlc3MoZXYpIHtcbiAgICAgICAgICAgIHVwbG9hZC50b3RhbCA9IGV2LnRvdGFsO1xuICAgICAgICAgICAgdXBsb2FkLmxvYWRlZCA9IGV2LmxvYWRlZDtcbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAndXBsb2FkX3Byb2dyZXNzJywgdXBsb2FkOiB1cGxvYWR9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwcm9tLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBYWFg6IHVwbG9hZC5wcm9taXNlIG11c3QgYmUgdGhlIHByb21pc2UgdGhhdFxuICAgICAgICAgICAgLy8gaXMgcmV0dXJuZWQgYnkgdXBsb2FkRmlsZSBhcyBpdCBoYXMgYW4gYWJvcnQoKVxuICAgICAgICAgICAgLy8gbWV0aG9kIGhhY2tlZCBvbnRvIGl0LlxuICAgICAgICAgICAgdXBsb2FkLnByb21pc2UgPSB1cGxvYWRGaWxlKFxuICAgICAgICAgICAgICAgIG1hdHJpeENsaWVudCwgcm9vbUlkLCBmaWxlLCBvblByb2dyZXNzLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiB1cGxvYWQucHJvbWlzZS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGNvbnRlbnQuZmlsZSA9IHJlc3VsdC5maWxlO1xuICAgICAgICAgICAgICAgIGNvbnRlbnQudXJsID0gcmVzdWx0LnVybDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KS50aGVuKCh1cmwpID0+IHtcbiAgICAgICAgICAgIC8vIEF3YWl0IHByZXZpb3VzIG1lc3NhZ2UgYmVpbmcgc2VudCBpbnRvIHRoZSByb29tXG4gICAgICAgICAgICByZXR1cm4gcHJvbUJlZm9yZTtcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRyaXhDbGllbnQuc2VuZE1lc3NhZ2Uocm9vbUlkLCBjb250ZW50KTtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBlcnJvciA9IGVycjtcbiAgICAgICAgICAgIGlmICghdXBsb2FkLmNhbmNlbGVkKSB7XG4gICAgICAgICAgICAgICAgbGV0IGRlc2MgPSBfdChcIlRoZSBmaWxlICclKGZpbGVOYW1lKXMnIGZhaWxlZCB0byB1cGxvYWQuXCIsIHtmaWxlTmFtZTogdXBsb2FkLmZpbGVOYW1lfSk7XG4gICAgICAgICAgICAgICAgaWYgKGVyci5odHRwX3N0YXR1cyA9PSA0MTMpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVzYyA9IF90KFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUaGUgZmlsZSAnJShmaWxlTmFtZSlzJyBleGNlZWRzIHRoaXMgaG9tZXNlcnZlcidzIHNpemUgbGltaXQgZm9yIHVwbG9hZHNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHtmaWxlTmFtZTogdXBsb2FkLmZpbGVOYW1lfSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdVcGxvYWQgZmFpbGVkJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnVXBsb2FkIEZhaWxlZCcpLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzYyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbnByb2dyZXNzS2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuaW5wcm9ncmVzcyk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuaW5wcm9ncmVzcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGsgPSBpbnByb2dyZXNzS2V5c1tpXTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pbnByb2dyZXNzW2tdLnByb21pc2UgPT09IHVwbG9hZC5wcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5wcm9ncmVzcy5zcGxpY2UoaywgMSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgIC8vIDQxMzogRmlsZSB3YXMgdG9vIGJpZyBvciB1cHNldCB0aGUgc2VydmVyIGluIHNvbWUgd2F5OlxuICAgICAgICAgICAgICAgIC8vIGNsZWFyIHRoZSBtZWRpYSBzaXplIGxpbWl0IHNvIHdlIGZldGNoIGl0IGFnYWluIG5leHQgdGltZVxuICAgICAgICAgICAgICAgIC8vIHdlIHRyeSB0byB1cGxvYWRcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IgJiYgZXJyb3IuaHR0cF9zdGF0dXMgPT09IDQxMykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tZWRpYUNvbmZpZyA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAndXBsb2FkX2ZhaWxlZCcsIHVwbG9hZCwgZXJyb3J9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICd1cGxvYWRfZmluaXNoZWQnLCB1cGxvYWR9KTtcbiAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ21lc3NhZ2Vfc2VudCd9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZ2V0Q3VycmVudFVwbG9hZHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlucHJvZ3Jlc3MuZmlsdGVyKHUgPT4gIXUuY2FuY2VsZWQpO1xuICAgIH1cblxuICAgIGNhbmNlbFVwbG9hZChwcm9taXNlKSB7XG4gICAgICAgIGNvbnN0IGlucHJvZ3Jlc3NLZXlzID0gT2JqZWN0LmtleXModGhpcy5pbnByb2dyZXNzKTtcbiAgICAgICAgbGV0IHVwbG9hZDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmlucHJvZ3Jlc3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGNvbnN0IGsgPSBpbnByb2dyZXNzS2V5c1tpXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlucHJvZ3Jlc3Nba10ucHJvbWlzZSA9PT0gcHJvbWlzZSkge1xuICAgICAgICAgICAgICAgIHVwbG9hZCA9IHRoaXMuaW5wcm9ncmVzc1trXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodXBsb2FkKSB7XG4gICAgICAgICAgICB1cGxvYWQuY2FuY2VsZWQgPSB0cnVlO1xuICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLmNhbmNlbFVwbG9hZCh1cGxvYWQucHJvbWlzZSk7XG4gICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ3VwbG9hZF9jYW5jZWxlZCcsIHVwbG9hZH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19