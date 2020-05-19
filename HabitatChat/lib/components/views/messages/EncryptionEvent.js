"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../languageHandler");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

/*
Copyright 2020 The Matrix.org Foundation C.I.C.

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
class EncryptionEvent extends _react.default.Component {
  render() {
    const {
      mxEvent
    } = this.props;
    let body;
    let classes = "mx_EventTile_bubble mx_cryptoEvent mx_cryptoEvent_icon";

    if (mxEvent.getContent().algorithm === 'm.megolm.v1.aes-sha2' && _MatrixClientPeg.MatrixClientPeg.get().isRoomEncrypted(mxEvent.getRoomId())) {
      body = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_cryptoEvent_title"
      }, (0, _languageHandler._t)("Encryption enabled")), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_cryptoEvent_subtitle"
      }, (0, _languageHandler._t)("Messages in this room are end-to-end encrypted. " + "Learn more & verify this user in their user profile.")));
    } else {
      body = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_cryptoEvent_title"
      }, (0, _languageHandler._t)("Encryption not enabled")), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_cryptoEvent_subtitle"
      }, (0, _languageHandler._t)("The encryption used by this room isn't supported.")));
      classes += " mx_cryptoEvent_icon_warning";
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: classes
    }, body);
  }

}

exports.default = EncryptionEvent;
EncryptionEvent.propTypes = {
  /* the MatrixEvent to show */
  mxEvent: _propTypes.default.object.isRequired
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL21lc3NhZ2VzL0VuY3J5cHRpb25FdmVudC5qcyJdLCJuYW1lcyI6WyJFbmNyeXB0aW9uRXZlbnQiLCJSZWFjdCIsIkNvbXBvbmVudCIsInJlbmRlciIsIm14RXZlbnQiLCJwcm9wcyIsImJvZHkiLCJjbGFzc2VzIiwiZ2V0Q29udGVudCIsImFsZ29yaXRobSIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImlzUm9vbUVuY3J5cHRlZCIsImdldFJvb21JZCIsInByb3BUeXBlcyIsIlByb3BUeXBlcyIsIm9iamVjdCIsImlzUmVxdWlyZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFuQkE7Ozs7Ozs7Ozs7Ozs7OztBQXFCZSxNQUFNQSxlQUFOLFNBQThCQyxlQUFNQyxTQUFwQyxDQUE4QztBQUN6REMsRUFBQUEsTUFBTSxHQUFHO0FBQ0wsVUFBTTtBQUFDQyxNQUFBQTtBQUFELFFBQVksS0FBS0MsS0FBdkI7QUFFQSxRQUFJQyxJQUFKO0FBQ0EsUUFBSUMsT0FBTyxHQUFHLHdEQUFkOztBQUNBLFFBQ0lILE9BQU8sQ0FBQ0ksVUFBUixHQUFxQkMsU0FBckIsS0FBbUMsc0JBQW5DLElBQ0FDLGlDQUFnQkMsR0FBaEIsR0FBc0JDLGVBQXRCLENBQXNDUixPQUFPLENBQUNTLFNBQVIsRUFBdEMsQ0FGSixFQUdFO0FBQ0VQLE1BQUFBLElBQUksZ0JBQUcsdURBQ0g7QUFBSyxRQUFBLFNBQVMsRUFBQztBQUFmLFNBQXVDLHlCQUFHLG9CQUFILENBQXZDLENBREcsZUFFSDtBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsU0FDSyx5QkFDRyxxREFDQSxzREFGSCxDQURMLENBRkcsQ0FBUDtBQVNILEtBYkQsTUFhTztBQUNIQSxNQUFBQSxJQUFJLGdCQUFHLHVEQUNIO0FBQUssUUFBQSxTQUFTLEVBQUM7QUFBZixTQUF1Qyx5QkFBRyx3QkFBSCxDQUF2QyxDQURHLGVBRUg7QUFBSyxRQUFBLFNBQVMsRUFBQztBQUFmLFNBQTBDLHlCQUFHLG1EQUFILENBQTFDLENBRkcsQ0FBUDtBQUlBQyxNQUFBQSxPQUFPLElBQUksOEJBQVg7QUFDSDs7QUFFRCx3QkFBUTtBQUFLLE1BQUEsU0FBUyxFQUFFQTtBQUFoQixPQUNIRCxJQURHLENBQVI7QUFHSDs7QUE5QndEOzs7QUFpQzdETixlQUFlLENBQUNjLFNBQWhCLEdBQTRCO0FBQ3hCO0FBQ0FWLEVBQUFBLE9BQU8sRUFBRVcsbUJBQVVDLE1BQVYsQ0FBaUJDO0FBRkYsQ0FBNUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCB7IE1hdHJpeENsaWVudFBlZyB9IGZyb20gJy4uLy4uLy4uL01hdHJpeENsaWVudFBlZyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVuY3J5cHRpb25FdmVudCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCB7bXhFdmVudH0gPSB0aGlzLnByb3BzO1xuXG4gICAgICAgIGxldCBib2R5O1xuICAgICAgICBsZXQgY2xhc3NlcyA9IFwibXhfRXZlbnRUaWxlX2J1YmJsZSBteF9jcnlwdG9FdmVudCBteF9jcnlwdG9FdmVudF9pY29uXCI7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIG14RXZlbnQuZ2V0Q29udGVudCgpLmFsZ29yaXRobSA9PT0gJ20ubWVnb2xtLnYxLmFlcy1zaGEyJyAmJlxuICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLmlzUm9vbUVuY3J5cHRlZChteEV2ZW50LmdldFJvb21JZCgpKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIGJvZHkgPSA8ZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfY3J5cHRvRXZlbnRfdGl0bGVcIj57X3QoXCJFbmNyeXB0aW9uIGVuYWJsZWRcIil9PC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9jcnlwdG9FdmVudF9zdWJ0aXRsZVwiPlxuICAgICAgICAgICAgICAgICAgICB7X3QoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIk1lc3NhZ2VzIGluIHRoaXMgcm9vbSBhcmUgZW5kLXRvLWVuZCBlbmNyeXB0ZWQuIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiTGVhcm4gbW9yZSAmIHZlcmlmeSB0aGlzIHVzZXIgaW4gdGhlaXIgdXNlciBwcm9maWxlLlwiLFxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYm9keSA9IDxkaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9jcnlwdG9FdmVudF90aXRsZVwiPntfdChcIkVuY3J5cHRpb24gbm90IGVuYWJsZWRcIil9PC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9jcnlwdG9FdmVudF9zdWJ0aXRsZVwiPntfdChcIlRoZSBlbmNyeXB0aW9uIHVzZWQgYnkgdGhpcyByb29tIGlzbid0IHN1cHBvcnRlZC5cIil9PC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICBjbGFzc2VzICs9IFwiIG14X2NyeXB0b0V2ZW50X2ljb25fd2FybmluZ1wiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICg8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc30+XG4gICAgICAgICAgICB7Ym9keX1cbiAgICAgICAgPC9kaXY+KTtcbiAgICB9XG59XG5cbkVuY3J5cHRpb25FdmVudC5wcm9wVHlwZXMgPSB7XG4gICAgLyogdGhlIE1hdHJpeEV2ZW50IHRvIHNob3cgKi9cbiAgICBteEV2ZW50OiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG59O1xuIl19