/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>

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
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _DateUtils = require("../../../DateUtils");

var _languageHandler = require("../../../languageHandler");

var _filesize = _interopRequireDefault(require("filesize"));

var _AccessibleButton = _interopRequireDefault(require("./AccessibleButton"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _Keyboard = require("../../../Keyboard");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

class ImageView extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onKeyDown", ev => {
      if (ev.key === _Keyboard.Key.ESCAPE) {
        ev.stopPropagation();
        ev.preventDefault();
        this.props.onFinished();
      }
    });
    (0, _defineProperty2.default)(this, "onRedactClick", () => {
      const ConfirmRedactDialog = sdk.getComponent("dialogs.ConfirmRedactDialog");

      _Modal.default.createTrackedDialog('Confirm Redact Dialog', 'Image View', ConfirmRedactDialog, {
        onFinished: proceed => {
          if (!proceed) return;
          this.props.onFinished();

          _MatrixClientPeg.MatrixClientPeg.get().redactEvent(this.props.mxEvent.getRoomId(), this.props.mxEvent.getId()).catch(function (e) {
            const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog"); // display error message stating you couldn't delete this.

            const code = e.errcode || e.statusCode;

            _Modal.default.createTrackedDialog('You cannot delete this image.', '', ErrorDialog, {
              title: (0, _languageHandler._t)('Error'),
              description: (0, _languageHandler._t)('You cannot delete this image. (%(code)s)', {
                code: code
              })
            });
          });
        }
      });
    });
    (0, _defineProperty2.default)(this, "rotateCounterClockwise", () => {
      const cur = this.state.rotationDegrees;
      const rotationDegrees = (cur - 90) % 360;
      this.setState({
        rotationDegrees
      });
    });
    (0, _defineProperty2.default)(this, "rotateClockwise", () => {
      const cur = this.state.rotationDegrees;
      const rotationDegrees = (cur + 90) % 360;
      this.setState({
        rotationDegrees
      });
    });
    this.state = {
      rotationDegrees: 0
    };
  } // XXX: keyboard shortcuts for managing dialogs should be done by the modal
  // dialog base class somehow, surely...


  componentDidMount() {
    document.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.onKeyDown);
  }

  getName() {
    let name = this.props.name;

    if (name && this.props.link) {
      name = /*#__PURE__*/_react.default.createElement("a", {
        href: this.props.link,
        target: "_blank",
        rel: "noreferrer noopener"
      }, name);
    }

    return name;
  }

  render() {
    /*
            // In theory max-width: 80%, max-height: 80% on the CSS should work
            // but in practice, it doesn't, so do it manually:
    
            var width = this.props.width || 500;
            var height = this.props.height || 500;
    
            var maxWidth = document.documentElement.clientWidth * 0.8;
            var maxHeight = document.documentElement.clientHeight * 0.8;
    
            var widthFrac = width / maxWidth;
            var heightFrac = height / maxHeight;
    
            var displayWidth;
            var displayHeight;
            if (widthFrac > heightFrac) {
                displayWidth = Math.min(width, maxWidth);
                displayHeight = (displayWidth / width) * height;
            } else {
                displayHeight = Math.min(height, maxHeight);
                displayWidth = (displayHeight / height) * width;
            }
    
            var style = {
                width: displayWidth,
                height: displayHeight
            };
    */
    let style = {};
    let res;

    if (this.props.width && this.props.height) {
      style = {
        width: this.props.width,
        height: this.props.height
      };
      res = style.width + "x" + style.height + "px";
    }

    let size;

    if (this.props.fileSize) {
      size = (0, _filesize.default)(this.props.fileSize);
    }

    let sizeRes;

    if (size && res) {
      sizeRes = size + ", " + res;
    } else {
      sizeRes = size || res;
    }

    let mayRedact = false;
    const showEventMeta = !!this.props.mxEvent;
    let eventMeta;

    if (showEventMeta) {
      // Figure out the sender, defaulting to mxid
      let sender = this.props.mxEvent.getSender();

      const cli = _MatrixClientPeg.MatrixClientPeg.get();

      const room = cli.getRoom(this.props.mxEvent.getRoomId());

      if (room) {
        mayRedact = room.currentState.maySendRedactionForEvent(this.props.mxEvent, cli.credentials.userId);
        const member = room.getMember(sender);
        if (member) sender = member.name;
      }

      eventMeta = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_ImageView_metadata"
      }, (0, _languageHandler._t)('Uploaded on %(date)s by %(user)s', {
        date: (0, _DateUtils.formatDate)(new Date(this.props.mxEvent.getTs())),
        user: sender
      }));
    }

    let eventRedact;

    if (mayRedact) {
      eventRedact = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_ImageView_button",
        onClick: this.onRedactClick
      }, (0, _languageHandler._t)('Remove'));
    }

    const rotationDegrees = this.state.rotationDegrees;

    const effectiveStyle = _objectSpread({
      transform: "rotate(".concat(rotationDegrees, "deg)")
    }, style);

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ImageView"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ImageView_lhs"
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ImageView_content"
    }, /*#__PURE__*/_react.default.createElement("img", {
      src: this.props.src,
      title: this.props.name,
      style: effectiveStyle,
      className: "mainImage"
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ImageView_labelWrapper"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ImageView_label"
    }, /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_ImageView_rotateCounterClockwise",
      title: (0, _languageHandler._t)("Rotate Left"),
      onClick: this.rotateCounterClockwise
    }, /*#__PURE__*/_react.default.createElement("img", {
      src: require("../../../../res/img/rotate-ccw.svg"),
      alt: (0, _languageHandler._t)('Rotate counter-clockwise'),
      width: "18",
      height: "18"
    })), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_ImageView_rotateClockwise",
      title: (0, _languageHandler._t)("Rotate Right"),
      onClick: this.rotateClockwise
    }, /*#__PURE__*/_react.default.createElement("img", {
      src: require("../../../../res/img/rotate-cw.svg"),
      alt: (0, _languageHandler._t)('Rotate clockwise'),
      width: "18",
      height: "18"
    })), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_ImageView_cancel",
      title: (0, _languageHandler._t)("Close"),
      onClick: this.props.onFinished
    }, /*#__PURE__*/_react.default.createElement("img", {
      src: require("../../../../res/img/cancel-white.svg"),
      width: "18",
      height: "18",
      alt: (0, _languageHandler._t)('Close')
    })), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ImageView_shim"
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ImageView_name"
    }, this.getName()), eventMeta, /*#__PURE__*/_react.default.createElement("a", {
      className: "mx_ImageView_link",
      href: this.props.src,
      download: this.props.name,
      target: "_blank",
      rel: "noopener"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ImageView_download"
    }, (0, _languageHandler._t)('Download this file'), /*#__PURE__*/_react.default.createElement("br", null), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_ImageView_size"
    }, sizeRes))), eventRedact, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ImageView_shim"
    })))), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ImageView_rhs"
    }));
  }

}

exports.default = ImageView;
(0, _defineProperty2.default)(ImageView, "propTypes", {
  src: _propTypes.default.string.isRequired,
  // the source of the image being displayed
  name: _propTypes.default.string,
  // the main title ('name') for the image
  link: _propTypes.default.string,
  // the link (if any) applied to the name of the image
  width: _propTypes.default.number,
  // width of the image src in pixels
  height: _propTypes.default.number,
  // height of the image src in pixels
  fileSize: _propTypes.default.number,
  // size of the image src in bytes
  onFinished: _propTypes.default.func.isRequired,
  // callback when the lightbox is dismissed
  // the event (if any) that the Image is displaying. Used for event-specific stuff like
  // redactions, senders, timestamps etc.  Other descriptors are taken from the explicit
  // properties above, which let us use lightboxes to display images which aren't associated
  // with events.
  mxEvent: _propTypes.default.object
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL0ltYWdlVmlldy5qcyJdLCJuYW1lcyI6WyJJbWFnZVZpZXciLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJldiIsImtleSIsIktleSIsIkVTQ0FQRSIsInN0b3BQcm9wYWdhdGlvbiIsInByZXZlbnREZWZhdWx0Iiwib25GaW5pc2hlZCIsIkNvbmZpcm1SZWRhY3REaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJwcm9jZWVkIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwicmVkYWN0RXZlbnQiLCJteEV2ZW50IiwiZ2V0Um9vbUlkIiwiZ2V0SWQiLCJjYXRjaCIsImUiLCJFcnJvckRpYWxvZyIsImNvZGUiLCJlcnJjb2RlIiwic3RhdHVzQ29kZSIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJjdXIiLCJzdGF0ZSIsInJvdGF0aW9uRGVncmVlcyIsInNldFN0YXRlIiwiY29tcG9uZW50RGlkTW91bnQiLCJkb2N1bWVudCIsImFkZEV2ZW50TGlzdGVuZXIiLCJvbktleURvd24iLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJnZXROYW1lIiwibmFtZSIsImxpbmsiLCJyZW5kZXIiLCJzdHlsZSIsInJlcyIsIndpZHRoIiwiaGVpZ2h0Iiwic2l6ZSIsImZpbGVTaXplIiwic2l6ZVJlcyIsIm1heVJlZGFjdCIsInNob3dFdmVudE1ldGEiLCJldmVudE1ldGEiLCJzZW5kZXIiLCJnZXRTZW5kZXIiLCJjbGkiLCJyb29tIiwiZ2V0Um9vbSIsImN1cnJlbnRTdGF0ZSIsIm1heVNlbmRSZWRhY3Rpb25Gb3JFdmVudCIsImNyZWRlbnRpYWxzIiwidXNlcklkIiwibWVtYmVyIiwiZ2V0TWVtYmVyIiwiZGF0ZSIsIkRhdGUiLCJnZXRUcyIsInVzZXIiLCJldmVudFJlZGFjdCIsIm9uUmVkYWN0Q2xpY2siLCJlZmZlY3RpdmVTdHlsZSIsInRyYW5zZm9ybSIsInNyYyIsInJvdGF0ZUNvdW50ZXJDbG9ja3dpc2UiLCJyZXF1aXJlIiwicm90YXRlQ2xvY2t3aXNlIiwiUHJvcFR5cGVzIiwic3RyaW5nIiwiaXNSZXF1aXJlZCIsIm51bWJlciIsImZ1bmMiLCJvYmplY3QiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOzs7Ozs7Ozs7Ozs7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVlLE1BQU1BLFNBQU4sU0FBd0JDLGVBQU1DLFNBQTlCLENBQXdDO0FBaUJuREMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBRGUscURBZU5DLEVBQUQsSUFBUTtBQUNoQixVQUFJQSxFQUFFLENBQUNDLEdBQUgsS0FBV0MsY0FBSUMsTUFBbkIsRUFBMkI7QUFDdkJILFFBQUFBLEVBQUUsQ0FBQ0ksZUFBSDtBQUNBSixRQUFBQSxFQUFFLENBQUNLLGNBQUg7QUFDQSxhQUFLTixLQUFMLENBQVdPLFVBQVg7QUFDSDtBQUNKLEtBckJrQjtBQUFBLHlEQXVCSCxNQUFNO0FBQ2xCLFlBQU1DLG1CQUFtQixHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsNkJBQWpCLENBQTVCOztBQUNBQyxxQkFBTUMsbUJBQU4sQ0FBMEIsdUJBQTFCLEVBQW1ELFlBQW5ELEVBQWlFSixtQkFBakUsRUFBc0Y7QUFDbEZELFFBQUFBLFVBQVUsRUFBR00sT0FBRCxJQUFhO0FBQ3JCLGNBQUksQ0FBQ0EsT0FBTCxFQUFjO0FBQ2QsZUFBS2IsS0FBTCxDQUFXTyxVQUFYOztBQUNBTywyQ0FBZ0JDLEdBQWhCLEdBQXNCQyxXQUF0QixDQUNJLEtBQUtoQixLQUFMLENBQVdpQixPQUFYLENBQW1CQyxTQUFuQixFQURKLEVBQ29DLEtBQUtsQixLQUFMLENBQVdpQixPQUFYLENBQW1CRSxLQUFu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RyxvQkFBSCxDQURWLGVBQ29DLHdDQURwQyxlQUVTO0FBQU0sTUFBQSxTQUFTLEVBQUM7QUFBaEIsT0FBc0NTLE9BQXRDLENBRlQsQ0FESixDQWhCSixFQXNCTW1CLFdBdEJOLGVBdUJJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixNQXZCSixDQURKLENBRkosQ0FISixlQWtDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsTUFsQ0osQ0FESjtBQXVDSDs7QUE3TWtEOzs7OEJBQWxDdkUsUyxlQUNFO0FBQ2YyRSxFQUFBQSxHQUFHLEVBQUVJLG1CQUFVQyxNQUFWLENBQWlCQyxVQURQO0FBQ21CO0FBQ2xDdEMsRUFBQUEsSUFBSSxFQUFFb0MsbUJBQVVDLE1BRkQ7QUFFUztBQUN4QnBDLEVBQUFBLElBQUksRUFBRW1DLG1CQUFVQyxNQUhEO0FBR1M7QUFDeEJoQyxFQUFBQSxLQUFLLEVBQUUrQixtQkFBVUcsTUFKRjtBQUlVO0FBQ3pCakMsRUFBQUEsTUFBTSxFQUFFOEIsbUJBQVVHLE1BTEg7QUFLVztBQUMxQi9CLEVBQUFBLFFBQVEsRUFBRTRCLG1CQUFVRyxNQU5MO0FBTWE7QUFDNUJ2RSxFQUFBQSxVQUFVLEVBQUVvRSxtQkFBVUksSUFBVixDQUFlRixVQVBaO0FBT3dCO0FBRXZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E1RCxFQUFBQSxPQUFPLEVBQUUwRCxtQkFBVUs7QUFiSixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxOSBNaWNoYWVsIFRlbGF0eW5za2kgPDd0M2NoZ3V5QGdtYWlsLmNvbT5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCB7Zm9ybWF0RGF0ZX0gZnJvbSAnLi4vLi4vLi4vRGF0ZVV0aWxzJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBmaWxlc2l6ZSBmcm9tIFwiZmlsZXNpemVcIjtcbmltcG9ydCBBY2Nlc3NpYmxlQnV0dG9uIGZyb20gXCIuL0FjY2Vzc2libGVCdXR0b25cIjtcbmltcG9ydCBNb2RhbCBmcm9tIFwiLi4vLi4vLi4vTW9kYWxcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vaW5kZXhcIjtcbmltcG9ydCB7S2V5fSBmcm9tIFwiLi4vLi4vLi4vS2V5Ym9hcmRcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW1hZ2VWaWV3IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBzcmM6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCwgLy8gdGhlIHNvdXJjZSBvZiB0aGUgaW1hZ2UgYmVpbmcgZGlzcGxheWVkXG4gICAgICAgIG5hbWU6IFByb3BUeXBlcy5zdHJpbmcsIC8vIHRoZSBtYWluIHRpdGxlICgnbmFtZScpIGZvciB0aGUgaW1hZ2VcbiAgICAgICAgbGluazogUHJvcFR5cGVzLnN0cmluZywgLy8gdGhlIGxpbmsgKGlmIGFueSkgYXBwbGllZCB0byB0aGUgbmFtZSBvZiB0aGUgaW1hZ2VcbiAgICAgICAgd2lkdGg6IFByb3BUeXBlcy5udW1iZXIsIC8vIHdpZHRoIG9mIHRoZSBpbWFnZSBzcmMgaW4gcGl4ZWxzXG4gICAgICAgIGhlaWdodDogUHJvcFR5cGVzLm51bWJlciwgLy8gaGVpZ2h0IG9mIHRoZSBpbWFnZSBzcmMgaW4gcGl4ZWxzXG4gICAgICAgIGZpbGVTaXplOiBQcm9wVHlwZXMubnVtYmVyLCAvLyBzaXplIG9mIHRoZSBpbWFnZSBzcmMgaW4gYnl0ZXNcbiAgICAgICAgb25GaW5pc2hlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCwgLy8gY2FsbGJhY2sgd2hlbiB0aGUgbGlnaHRib3ggaXMgZGlzbWlzc2VkXG5cbiAgICAgICAgLy8gdGhlIGV2ZW50IChpZiBhbnkpIHRoYXQgdGhlIEltYWdlIGlzIGRpc3BsYXlpbmcuIFVzZWQgZm9yIGV2ZW50LXNwZWNpZmljIHN0dWZmIGxpa2VcbiAgICAgICAgLy8gcmVkYWN0aW9ucywgc2VuZGVycywgdGltZXN0YW1wcyBldGMuICBPdGhlciBkZXNjcmlwdG9ycyBhcmUgdGFrZW4gZnJvbSB0aGUgZXhwbGljaXRcbiAgICAgICAgLy8gcHJvcGVydGllcyBhYm92ZSwgd2hpY2ggbGV0IHVzIHVzZSBsaWdodGJveGVzIHRvIGRpc3BsYXkgaW1hZ2VzIHdoaWNoIGFyZW4ndCBhc3NvY2lhdGVkXG4gICAgICAgIC8vIHdpdGggZXZlbnRzLlxuICAgICAgICBteEV2ZW50OiBQcm9wVHlwZXMub2JqZWN0LFxuICAgIH07XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB7IHJvdGF0aW9uRGVncmVlczogMCB9O1xuICAgIH1cblxuICAgIC8vIFhYWDoga2V5Ym9hcmQgc2hvcnRjdXRzIGZvciBtYW5hZ2luZyBkaWFsb2dzIHNob3VsZCBiZSBkb25lIGJ5IHRoZSBtb2RhbFxuICAgIC8vIGRpYWxvZyBiYXNlIGNsYXNzIHNvbWVob3csIHN1cmVseS4uLlxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLm9uS2V5RG93bik7XG4gICAgfVxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMub25LZXlEb3duKTtcbiAgICB9XG5cbiAgICBvbktleURvd24gPSAoZXYpID0+IHtcbiAgICAgICAgaWYgKGV2LmtleSA9PT0gS2V5LkVTQ0FQRSkge1xuICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgb25SZWRhY3RDbGljayA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgQ29uZmlybVJlZGFjdERpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkNvbmZpcm1SZWRhY3REaWFsb2dcIik7XG4gICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0NvbmZpcm0gUmVkYWN0IERpYWxvZycsICdJbWFnZSBWaWV3JywgQ29uZmlybVJlZGFjdERpYWxvZywge1xuICAgICAgICAgICAgb25GaW5pc2hlZDogKHByb2NlZWQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXByb2NlZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoKTtcbiAgICAgICAgICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVkYWN0RXZlbnQoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcHMubXhFdmVudC5nZXRSb29tSWQoKSwgdGhpcy5wcm9wcy5teEV2ZW50LmdldElkKCksXG4gICAgICAgICAgICAgICAgKS5jYXRjaChmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG4gICAgICAgICAgICAgICAgICAgIC8vIGRpc3BsYXkgZXJyb3IgbWVzc2FnZSBzdGF0aW5nIHlvdSBjb3VsZG4ndCBkZWxldGUgdGhpcy5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29kZSA9IGUuZXJyY29kZSB8fCBlLnN0YXR1c0NvZGU7XG4gICAgICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1lvdSBjYW5ub3QgZGVsZXRlIHRoaXMgaW1hZ2UuJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ0Vycm9yJyksXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoJ1lvdSBjYW5ub3QgZGVsZXRlIHRoaXMgaW1hZ2UuICglKGNvZGUpcyknLCB7Y29kZTogY29kZX0pLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBnZXROYW1lKCkge1xuICAgICAgICBsZXQgbmFtZSA9IHRoaXMucHJvcHMubmFtZTtcbiAgICAgICAgaWYgKG5hbWUgJiYgdGhpcy5wcm9wcy5saW5rKSB7XG4gICAgICAgICAgICBuYW1lID0gPGEgaHJlZj17IHRoaXMucHJvcHMubGluayB9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXIgbm9vcGVuZXJcIj57IG5hbWUgfTwvYT47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfVxuXG4gICAgcm90YXRlQ291bnRlckNsb2Nrd2lzZSA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgY3VyID0gdGhpcy5zdGF0ZS5yb3RhdGlvbkRlZ3JlZXM7XG4gICAgICAgIGNvbnN0IHJvdGF0aW9uRGVncmVlcyA9IChjdXIgLSA5MCkgJSAzNjA7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyByb3RhdGlvbkRlZ3JlZXMgfSk7XG4gICAgfTtcblxuICAgIHJvdGF0ZUNsb2Nrd2lzZSA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgY3VyID0gdGhpcy5zdGF0ZS5yb3RhdGlvbkRlZ3JlZXM7XG4gICAgICAgIGNvbnN0IHJvdGF0aW9uRGVncmVlcyA9IChjdXIgKyA5MCkgJSAzNjA7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyByb3RhdGlvbkRlZ3JlZXMgfSk7XG4gICAgfTtcblxuICAgIHJlbmRlcigpIHtcbi8qXG4gICAgICAgIC8vIEluIHRoZW9yeSBtYXgtd2lkdGg6IDgwJSwgbWF4LWhlaWdodDogODAlIG9uIHRoZSBDU1Mgc2hvdWxkIHdvcmtcbiAgICAgICAgLy8gYnV0IGluIHByYWN0aWNlLCBpdCBkb2Vzbid0LCBzbyBkbyBpdCBtYW51YWxseTpcblxuICAgICAgICB2YXIgd2lkdGggPSB0aGlzLnByb3BzLndpZHRoIHx8IDUwMDtcbiAgICAgICAgdmFyIGhlaWdodCA9IHRoaXMucHJvcHMuaGVpZ2h0IHx8IDUwMDtcblxuICAgICAgICB2YXIgbWF4V2lkdGggPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggKiAwLjg7XG4gICAgICAgIHZhciBtYXhIZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0ICogMC44O1xuXG4gICAgICAgIHZhciB3aWR0aEZyYWMgPSB3aWR0aCAvIG1heFdpZHRoO1xuICAgICAgICB2YXIgaGVpZ2h0RnJhYyA9IGhlaWdodCAvIG1heEhlaWdodDtcblxuICAgICAgICB2YXIgZGlzcGxheVdpZHRoO1xuICAgICAgICB2YXIgZGlzcGxheUhlaWdodDtcbiAgICAgICAgaWYgKHdpZHRoRnJhYyA+IGhlaWdodEZyYWMpIHtcbiAgICAgICAgICAgIGRpc3BsYXlXaWR0aCA9IE1hdGgubWluKHdpZHRoLCBtYXhXaWR0aCk7XG4gICAgICAgICAgICBkaXNwbGF5SGVpZ2h0ID0gKGRpc3BsYXlXaWR0aCAvIHdpZHRoKSAqIGhlaWdodDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRpc3BsYXlIZWlnaHQgPSBNYXRoLm1pbihoZWlnaHQsIG1heEhlaWdodCk7XG4gICAgICAgICAgICBkaXNwbGF5V2lkdGggPSAoZGlzcGxheUhlaWdodCAvIGhlaWdodCkgKiB3aWR0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdHlsZSA9IHtcbiAgICAgICAgICAgIHdpZHRoOiBkaXNwbGF5V2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGRpc3BsYXlIZWlnaHRcbiAgICAgICAgfTtcbiovXG4gICAgICAgIGxldCBzdHlsZSA9IHt9O1xuICAgICAgICBsZXQgcmVzO1xuXG4gICAgICAgIGlmICh0aGlzLnByb3BzLndpZHRoICYmIHRoaXMucHJvcHMuaGVpZ2h0KSB7XG4gICAgICAgICAgICBzdHlsZSA9IHtcbiAgICAgICAgICAgICAgICB3aWR0aDogdGhpcy5wcm9wcy53aWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMucHJvcHMuaGVpZ2h0LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcyA9IHN0eWxlLndpZHRoICsgXCJ4XCIgKyBzdHlsZS5oZWlnaHQgKyBcInB4XCI7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc2l6ZTtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuZmlsZVNpemUpIHtcbiAgICAgICAgICAgIHNpemUgPSBmaWxlc2l6ZSh0aGlzLnByb3BzLmZpbGVTaXplKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBzaXplUmVzO1xuICAgICAgICBpZiAoc2l6ZSAmJiByZXMpIHtcbiAgICAgICAgICAgIHNpemVSZXMgPSBzaXplICsgXCIsIFwiICsgcmVzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2l6ZVJlcyA9IHNpemUgfHwgcmVzO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG1heVJlZGFjdCA9IGZhbHNlO1xuICAgICAgICBjb25zdCBzaG93RXZlbnRNZXRhID0gISF0aGlzLnByb3BzLm14RXZlbnQ7XG5cbiAgICAgICAgbGV0IGV2ZW50TWV0YTtcbiAgICAgICAgaWYgKHNob3dFdmVudE1ldGEpIHtcbiAgICAgICAgICAgIC8vIEZpZ3VyZSBvdXQgdGhlIHNlbmRlciwgZGVmYXVsdGluZyB0byBteGlkXG4gICAgICAgICAgICBsZXQgc2VuZGVyID0gdGhpcy5wcm9wcy5teEV2ZW50LmdldFNlbmRlcigpO1xuICAgICAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICAgICAgY29uc3Qgcm9vbSA9IGNsaS5nZXRSb29tKHRoaXMucHJvcHMubXhFdmVudC5nZXRSb29tSWQoKSk7XG4gICAgICAgICAgICBpZiAocm9vbSkge1xuICAgICAgICAgICAgICAgIG1heVJlZGFjdCA9IHJvb20uY3VycmVudFN0YXRlLm1heVNlbmRSZWRhY3Rpb25Gb3JFdmVudCh0aGlzLnByb3BzLm14RXZlbnQsIGNsaS5jcmVkZW50aWFscy51c2VySWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1lbWJlciA9IHJvb20uZ2V0TWVtYmVyKHNlbmRlcik7XG4gICAgICAgICAgICAgICAgaWYgKG1lbWJlcikgc2VuZGVyID0gbWVtYmVyLm5hbWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV2ZW50TWV0YSA9ICg8ZGl2IGNsYXNzTmFtZT1cIm14X0ltYWdlVmlld19tZXRhZGF0YVwiPlxuICAgICAgICAgICAgICAgIHsgX3QoJ1VwbG9hZGVkIG9uICUoZGF0ZSlzIGJ5ICUodXNlcilzJywge1xuICAgICAgICAgICAgICAgICAgICBkYXRlOiBmb3JtYXREYXRlKG5ldyBEYXRlKHRoaXMucHJvcHMubXhFdmVudC5nZXRUcygpKSksXG4gICAgICAgICAgICAgICAgICAgIHVzZXI6IHNlbmRlcixcbiAgICAgICAgICAgICAgICB9KSB9XG4gICAgICAgICAgICA8L2Rpdj4pO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGV2ZW50UmVkYWN0O1xuICAgICAgICBpZiAobWF5UmVkYWN0KSB7XG4gICAgICAgICAgICBldmVudFJlZGFjdCA9ICg8ZGl2IGNsYXNzTmFtZT1cIm14X0ltYWdlVmlld19idXR0b25cIiBvbkNsaWNrPXt0aGlzLm9uUmVkYWN0Q2xpY2t9PlxuICAgICAgICAgICAgICAgIHsgX3QoJ1JlbW92ZScpIH1cbiAgICAgICAgICAgIDwvZGl2Pik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByb3RhdGlvbkRlZ3JlZXMgPSB0aGlzLnN0YXRlLnJvdGF0aW9uRGVncmVlcztcbiAgICAgICAgY29uc3QgZWZmZWN0aXZlU3R5bGUgPSB7dHJhbnNmb3JtOiBgcm90YXRlKCR7cm90YXRpb25EZWdyZWVzfWRlZylgLCAuLi5zdHlsZX07XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfSW1hZ2VWaWV3XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9JbWFnZVZpZXdfbGhzXCI+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9JbWFnZVZpZXdfY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17dGhpcy5wcm9wcy5zcmN9IHRpdGxlPXt0aGlzLnByb3BzLm5hbWV9IHN0eWxlPXtlZmZlY3RpdmVTdHlsZX0gY2xhc3NOYW1lPVwibWFpbkltYWdlXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9JbWFnZVZpZXdfbGFiZWxXcmFwcGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0ltYWdlVmlld19sYWJlbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIGNsYXNzTmFtZT1cIm14X0ltYWdlVmlld19yb3RhdGVDb3VudGVyQ2xvY2t3aXNlXCIgdGl0bGU9e190KFwiUm90YXRlIExlZnRcIil9IG9uQ2xpY2s9eyB0aGlzLnJvdGF0ZUNvdW50ZXJDbG9ja3dpc2UgfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL3JvdGF0ZS1jY3cuc3ZnXCIpfSBhbHQ9eyBfdCgnUm90YXRlIGNvdW50ZXItY2xvY2t3aXNlJykgfSB3aWR0aD1cIjE4XCIgaGVpZ2h0PVwiMThcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9JbWFnZVZpZXdfcm90YXRlQ2xvY2t3aXNlXCIgdGl0bGU9e190KFwiUm90YXRlIFJpZ2h0XCIpfSBvbkNsaWNrPXsgdGhpcy5yb3RhdGVDbG9ja3dpc2UgfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL3JvdGF0ZS1jdy5zdmdcIil9IGFsdD17IF90KCdSb3RhdGUgY2xvY2t3aXNlJykgfSB3aWR0aD1cIjE4XCIgaGVpZ2h0PVwiMThcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9JbWFnZVZpZXdfY2FuY2VsXCIgdGl0bGU9e190KFwiQ2xvc2VcIil9IG9uQ2xpY2s9eyB0aGlzLnByb3BzLm9uRmluaXNoZWQgfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9jYW5jZWwtd2hpdGUuc3ZnXCIpfSB3aWR0aD1cIjE4XCIgaGVpZ2h0PVwiMThcIiBhbHQ9eyBfdCgnQ2xvc2UnKSB9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfSW1hZ2VWaWV3X3NoaW1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0ltYWdlVmlld19uYW1lXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdGhpcy5nZXROYW1lKCkgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgZXZlbnRNZXRhIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJteF9JbWFnZVZpZXdfbGlua1wiIGhyZWY9eyB0aGlzLnByb3BzLnNyYyB9IGRvd25sb2FkPXsgdGhpcy5wcm9wcy5uYW1lIH0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9JbWFnZVZpZXdfZG93bmxvYWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IF90KCdEb3dubG9hZCB0aGlzIGZpbGUnKSB9PGJyIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X0ltYWdlVmlld19zaXplXCI+eyBzaXplUmVzIH08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGV2ZW50UmVkYWN0IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0ltYWdlVmlld19zaGltXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9JbWFnZVZpZXdfcmhzXCI+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=