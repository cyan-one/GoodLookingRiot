/*
 Copyright 2016 OpenMarket Ltd

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

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _react = _interopRequireDefault(require("react"));

var _MFileBody = _interopRequireDefault(require("./MFileBody"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _DecryptFile = require("../../../utils/DecryptFile");

var _languageHandler = require("../../../languageHandler");

class MAudioBody extends _react.default.Component {
  constructor(props) {
    super(props);
    this.state = {
      playing: false,
      decryptedUrl: null,
      decryptedBlob: null,
      error: null
    };
  }

  onPlayToggle() {
    this.setState({
      playing: !this.state.playing
    });
  }

  _getContentUrl() {
    const content = this.props.mxEvent.getContent();

    if (content.file !== undefined) {
      return this.state.decryptedUrl;
    } else {
      return _MatrixClientPeg.MatrixClientPeg.get().mxcUrlToHttp(content.url);
    }
  }

  componentDidMount() {
    const content = this.props.mxEvent.getContent();

    if (content.file !== undefined && this.state.decryptedUrl === null) {
      let decryptedBlob;
      (0, _DecryptFile.decryptFile)(content.file).then(function (blob) {
        decryptedBlob = blob;
        return URL.createObjectURL(decryptedBlob);
      }).then(url => {
        this.setState({
          decryptedUrl: url,
          decryptedBlob: decryptedBlob
        });
      }, err => {
        console.warn("Unable to decrypt attachment: ", err);
        this.setState({
          error: err
        });
      });
    }
  }

  componentWillUnmount() {
    if (this.state.decryptedUrl) {
      URL.revokeObjectURL(this.state.decryptedUrl);
    }
  }

  render() {
    const content = this.props.mxEvent.getContent();

    if (this.state.error !== null) {
      return /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_MAudioBody"
      }, /*#__PURE__*/_react.default.createElement("img", {
        src: require("../../../../res/img/warning.svg"),
        width: "16",
        height: "16"
      }), (0, _languageHandler._t)("Error decrypting audio"));
    }

    if (content.file !== undefined && this.state.decryptedUrl === null) {
      // Need to decrypt the attachment
      // The attachment is decrypted in componentDidMount.
      // For now add an img tag with a 16x16 spinner.
      // Not sure how tall the audio player is so not sure how tall it should actually be.
      return /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_MAudioBody"
      }, /*#__PURE__*/_react.default.createElement("img", {
        src: require("../../../../res/img/spinner.gif"),
        alt: content.body,
        width: "16",
        height: "16"
      }));
    }

    const contentUrl = this._getContentUrl();

    return /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_MAudioBody"
    }, /*#__PURE__*/_react.default.createElement("audio", {
      src: contentUrl,
      controls: true
    }), /*#__PURE__*/_react.default.createElement(_MFileBody.default, (0, _extends2.default)({}, this.props, {
      decryptedBlob: this.state.decryptedBlob
    })));
  }

}

exports.default = MAudioBody;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL21lc3NhZ2VzL01BdWRpb0JvZHkuanMiXSwibmFtZXMiOlsiTUF1ZGlvQm9keSIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsInN0YXRlIiwicGxheWluZyIsImRlY3J5cHRlZFVybCIsImRlY3J5cHRlZEJsb2IiLCJlcnJvciIsIm9uUGxheVRvZ2dsZSIsInNldFN0YXRlIiwiX2dldENvbnRlbnRVcmwiLCJjb250ZW50IiwibXhFdmVudCIsImdldENvbnRlbnQiLCJmaWxlIiwidW5kZWZpbmVkIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwibXhjVXJsVG9IdHRwIiwidXJsIiwiY29tcG9uZW50RGlkTW91bnQiLCJ0aGVuIiwiYmxvYiIsIlVSTCIsImNyZWF0ZU9iamVjdFVSTCIsImVyciIsImNvbnNvbGUiLCJ3YXJuIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJyZXZva2VPYmplY3RVUkwiLCJyZW5kZXIiLCJyZXF1aXJlIiwiYm9keSIsImNvbnRlbnRVcmwiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7QUFnQkE7Ozs7Ozs7Ozs7O0FBRUE7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBRWUsTUFBTUEsVUFBTixTQUF5QkMsZUFBTUMsU0FBL0IsQ0FBeUM7QUFDcERDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFRO0FBQ2YsVUFBTUEsS0FBTjtBQUNBLFNBQUtDLEtBQUwsR0FBYTtBQUNUQyxNQUFBQSxPQUFPLEVBQUUsS0FEQTtBQUVUQyxNQUFBQSxZQUFZLEVBQUUsSUFGTDtBQUdUQyxNQUFBQSxhQUFhLEVBQUUsSUFITjtBQUlUQyxNQUFBQSxLQUFLLEVBQUU7QUFKRSxLQUFiO0FBTUg7O0FBQ0RDLEVBQUFBLFlBQVksR0FBRztBQUNYLFNBQUtDLFFBQUwsQ0FBYztBQUNWTCxNQUFBQSxPQUFPLEVBQUUsQ0FBQyxLQUFLRCxLQUFMLENBQVdDO0FBRFgsS0FBZDtBQUdIOztBQUVETSxFQUFBQSxjQUFjLEdBQUc7QUFDYixVQUFNQyxPQUFPLEdBQUcsS0FBS1QsS0FBTCxDQUFXVSxPQUFYLENBQW1CQyxVQUFuQixFQUFoQjs7QUFDQSxRQUFJRixPQUFPLENBQUNHLElBQVIsS0FBaUJDLFNBQXJCLEVBQWdDO0FBQzVCLGFBQU8sS0FBS1osS0FBTCxDQUFXRSxZQUFsQjtBQUNILEtBRkQsTUFFTztBQUNILGFBQU9XLGlDQUFnQkMsR0FBaEIsR0FBc0JDLFlBQXRCLENBQW1DUCxPQUFPLENBQUNRLEdBQTNDLENBQVA7QUFDSDtBQUNKOztBQUVEQyxFQUFBQSxpQkFBaUIsR0FBRztBQUNoQixVQUFNVCxPQUFPLEdBQUcsS0FBS1QsS0FBTCxDQUFXVSxPQUFYLENBQW1CQyxVQUFuQixFQUFoQjs7QUFDQSxRQUFJRixPQUFPLENBQUNHLElBQVIsS0FBaUJDLFNBQWpCLElBQThCLEtBQUtaLEtBQUwsQ0FBV0UsWUFBWCxLQUE0QixJQUE5RCxFQUFvRTtBQUNoRSxVQUFJQyxhQUFKO0FBQ0Esb0NBQVlLLE9BQU8sQ0FBQ0csSUFBcEIsRUFBMEJPLElBQTFCLENBQStCLFVBQVNDLElBQVQsRUFBZTtBQUMxQ2hCLFFBQUFBLGFBQWEsR0FBR2dCLElBQWhCO0FBQ0EsZUFBT0MsR0FBRyxDQUFDQyxlQUFKLENBQW9CbEIsYUFBcEIsQ0FBUDtBQUNILE9BSEQsRUFHR2UsSUFISCxDQUdTRixHQUFELElBQVM7QUFDYixhQUFLVixRQUFMLENBQWM7QUFDVkosVUFBQUEsWUFBWSxFQUFFYyxHQURKO0FBRVZiLFVBQUFBLGFBQWEsRUFBRUE7QUFGTCxTQUFkO0FBSUgsT0FSRCxFQVFJbUIsR0FBRCxJQUFTO0FBQ1JDLFFBQUFBLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLGdDQUFiLEVBQStDRixHQUEvQztBQUNBLGFBQUtoQixRQUFMLENBQWM7QUFDVkYsVUFBQUEsS0FBSyxFQUFFa0I7QUFERyxTQUFkO0FBR0gsT0FiRDtBQWNIO0FBQ0o7O0FBRURHLEVBQUFBLG9CQUFvQixHQUFHO0FBQ25CLFFBQUksS0FBS3pCLEtBQUwsQ0FBV0UsWUFBZixFQUE2QjtBQUN6QmtCLE1BQUFBLEdBQUcsQ0FBQ00sZUFBSixDQUFvQixLQUFLMUIsS0FBTCxDQUFXRSxZQUEvQjtBQUNIO0FBQ0o7O0FBRUR5QixFQUFBQSxNQUFNLEdBQUc7QUFDTCxVQUFNbkIsT0FBTyxHQUFHLEtBQUtULEtBQUwsQ0FBV1UsT0FBWCxDQUFtQkMsVUFBbkIsRUFBaEI7O0FBRUEsUUFBSSxLQUFLVixLQUFMLENBQVdJLEtBQVgsS0FBcUIsSUFBekIsRUFBK0I7QUFDM0IsMEJBQ0k7QUFBTSxRQUFBLFNBQVMsRUFBQztBQUFoQixzQkFDSTtBQUFLLFFBQUEsR0FBRyxFQUFFd0IsT0FBTyxDQUFDLGlDQUFELENBQWpCO0FBQXNELFFBQUEsS0FBSyxFQUFDLElBQTVEO0FBQWlFLFFBQUEsTUFBTSxFQUFDO0FBQXhFLFFBREosRUFFTSx5QkFBRyx3QkFBSCxDQUZOLENBREo7QUFNSDs7QUFFRCxRQUFJcEIsT0FBTyxDQUFDRyxJQUFSLEtBQWlCQyxTQUFqQixJQUE4QixLQUFLWixLQUFMLENBQVdFLFlBQVgsS0FBNEIsSUFBOUQsRUFBb0U7QUFDaEU7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFDSTtBQUFNLFFBQUEsU0FBUyxFQUFDO0FBQWhCLHNCQUNJO0FBQUssUUFBQSxHQUFHLEVBQUUwQixPQUFPLENBQUMsaUNBQUQsQ0FBakI7QUFBc0QsUUFBQSxHQUFHLEVBQUVwQixPQUFPLENBQUNxQixJQUFuRTtBQUF5RSxRQUFBLEtBQUssRUFBQyxJQUEvRTtBQUFvRixRQUFBLE1BQU0sRUFBQztBQUEzRixRQURKLENBREo7QUFLSDs7QUFFRCxVQUFNQyxVQUFVLEdBQUcsS0FBS3ZCLGNBQUwsRUFBbkI7O0FBRUEsd0JBQ0k7QUFBTSxNQUFBLFNBQVMsRUFBQztBQUFoQixvQkFDSTtBQUFPLE1BQUEsR0FBRyxFQUFFdUIsVUFBWjtBQUF3QixNQUFBLFFBQVE7QUFBaEMsTUFESixlQUVJLDZCQUFDLGtCQUFELDZCQUFlLEtBQUsvQixLQUFwQjtBQUEyQixNQUFBLGFBQWEsRUFBRSxLQUFLQyxLQUFMLENBQVdHO0FBQXJELE9BRkosQ0FESjtBQU1IOztBQXBGbUQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuIENvcHlyaWdodCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5cbiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG4gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IE1GaWxlQm9keSBmcm9tICcuL01GaWxlQm9keSc7XG5cbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0IHsgZGVjcnlwdEZpbGUgfSBmcm9tICcuLi8uLi8uLi91dGlscy9EZWNyeXB0RmlsZSc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1BdWRpb0JvZHkgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHBsYXlpbmc6IGZhbHNlLFxuICAgICAgICAgICAgZGVjcnlwdGVkVXJsOiBudWxsLFxuICAgICAgICAgICAgZGVjcnlwdGVkQmxvYjogbnVsbCxcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICB9O1xuICAgIH1cbiAgICBvblBsYXlUb2dnbGUoKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGxheWluZzogIXRoaXMuc3RhdGUucGxheWluZyxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX2dldENvbnRlbnRVcmwoKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLnByb3BzLm14RXZlbnQuZ2V0Q29udGVudCgpO1xuICAgICAgICBpZiAoY29udGVudC5maWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXRlLmRlY3J5cHRlZFVybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkubXhjVXJsVG9IdHRwKGNvbnRlbnQudXJsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gdGhpcy5wcm9wcy5teEV2ZW50LmdldENvbnRlbnQoKTtcbiAgICAgICAgaWYgKGNvbnRlbnQuZmlsZSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuc3RhdGUuZGVjcnlwdGVkVXJsID09PSBudWxsKSB7XG4gICAgICAgICAgICBsZXQgZGVjcnlwdGVkQmxvYjtcbiAgICAgICAgICAgIGRlY3J5cHRGaWxlKGNvbnRlbnQuZmlsZSkudGhlbihmdW5jdGlvbihibG9iKSB7XG4gICAgICAgICAgICAgICAgZGVjcnlwdGVkQmxvYiA9IGJsb2I7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFVSTC5jcmVhdGVPYmplY3RVUkwoZGVjcnlwdGVkQmxvYik7XG4gICAgICAgICAgICB9KS50aGVuKCh1cmwpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgZGVjcnlwdGVkVXJsOiB1cmwsXG4gICAgICAgICAgICAgICAgICAgIGRlY3J5cHRlZEJsb2I6IGRlY3J5cHRlZEJsb2IsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiVW5hYmxlIHRvIGRlY3J5cHQgYXR0YWNobWVudDogXCIsIGVycik7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnIsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kZWNyeXB0ZWRVcmwpIHtcbiAgICAgICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwodGhpcy5zdGF0ZS5kZWNyeXB0ZWRVcmwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gdGhpcy5wcm9wcy5teEV2ZW50LmdldENvbnRlbnQoKTtcblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5lcnJvciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9NQXVkaW9Cb2R5XCI+XG4gICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy93YXJuaW5nLnN2Z1wiKX0gd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgeyBfdChcIkVycm9yIGRlY3J5cHRpbmcgYXVkaW9cIikgfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29udGVudC5maWxlICE9PSB1bmRlZmluZWQgJiYgdGhpcy5zdGF0ZS5kZWNyeXB0ZWRVcmwgPT09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIE5lZWQgdG8gZGVjcnlwdCB0aGUgYXR0YWNobWVudFxuICAgICAgICAgICAgLy8gVGhlIGF0dGFjaG1lbnQgaXMgZGVjcnlwdGVkIGluIGNvbXBvbmVudERpZE1vdW50LlxuICAgICAgICAgICAgLy8gRm9yIG5vdyBhZGQgYW4gaW1nIHRhZyB3aXRoIGEgMTZ4MTYgc3Bpbm5lci5cbiAgICAgICAgICAgIC8vIE5vdCBzdXJlIGhvdyB0YWxsIHRoZSBhdWRpbyBwbGF5ZXIgaXMgc28gbm90IHN1cmUgaG93IHRhbGwgaXQgc2hvdWxkIGFjdHVhbGx5IGJlLlxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9NQXVkaW9Cb2R5XCI+XG4gICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9zcGlubmVyLmdpZlwiKX0gYWx0PXtjb250ZW50LmJvZHl9IHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIC8+XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbnRlbnRVcmwgPSB0aGlzLl9nZXRDb250ZW50VXJsKCk7XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X01BdWRpb0JvZHlcIj5cbiAgICAgICAgICAgICAgICA8YXVkaW8gc3JjPXtjb250ZW50VXJsfSBjb250cm9scyAvPlxuICAgICAgICAgICAgICAgIDxNRmlsZUJvZHkgey4uLnRoaXMucHJvcHN9IGRlY3J5cHRlZEJsb2I9e3RoaXMuc3RhdGUuZGVjcnlwdGVkQmxvYn0gLz5cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=