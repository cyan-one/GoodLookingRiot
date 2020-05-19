"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

/*
 Copyright 2019 Sorunome

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
class Spoiler extends _react.default.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false
    };
  }

  toggleVisible(e) {
    if (!this.state.visible) {
      // we are un-blurring, we don't want this click to propagate to potential child pills
      e.preventDefault();
      e.stopPropagation();
    }

    this.setState({
      visible: !this.state.visible
    });
  }

  render() {
    const reason = this.props.reason ? /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_EventTile_spoiler_reason"
    }, "(" + this.props.reason + ")") : null; // react doesn't allow appending a DOM node as child.
    // as such, we pass the this.props.contentHtml instead and then set the raw
    // HTML content. This is secure as the contents have already been parsed previously

    return /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_EventTile_spoiler" + (this.state.visible ? " visible" : ""),
      onClick: this.toggleVisible.bind(this)
    }, reason, "\xA0", /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_EventTile_spoiler_content",
      dangerouslySetInnerHTML: {
        __html: this.props.contentHtml
      }
    }));
  }

}

exports.default = Spoiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL1Nwb2lsZXIuanMiXSwibmFtZXMiOlsiU3BvaWxlciIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsInN0YXRlIiwidmlzaWJsZSIsInRvZ2dsZVZpc2libGUiLCJlIiwicHJldmVudERlZmF1bHQiLCJzdG9wUHJvcGFnYXRpb24iLCJzZXRTdGF0ZSIsInJlbmRlciIsInJlYXNvbiIsImJpbmQiLCJfX2h0bWwiLCJjb250ZW50SHRtbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBZ0JBOztBQWhCQTs7Ozs7Ozs7Ozs7Ozs7O0FBa0JlLE1BQU1BLE9BQU4sU0FBc0JDLGVBQU1DLFNBQTVCLENBQXNDO0FBQ2pEQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUTtBQUNmLFVBQU1BLEtBQU47QUFDQSxTQUFLQyxLQUFMLEdBQWE7QUFDVEMsTUFBQUEsT0FBTyxFQUFFO0FBREEsS0FBYjtBQUdIOztBQUVEQyxFQUFBQSxhQUFhLENBQUNDLENBQUQsRUFBSTtBQUNiLFFBQUksQ0FBQyxLQUFLSCxLQUFMLENBQVdDLE9BQWhCLEVBQXlCO0FBQ3JCO0FBQ0FFLE1BQUFBLENBQUMsQ0FBQ0MsY0FBRjtBQUNBRCxNQUFBQSxDQUFDLENBQUNFLGVBQUY7QUFDSDs7QUFDRCxTQUFLQyxRQUFMLENBQWM7QUFBRUwsTUFBQUEsT0FBTyxFQUFFLENBQUMsS0FBS0QsS0FBTCxDQUFXQztBQUF2QixLQUFkO0FBQ0g7O0FBRURNLEVBQUFBLE1BQU0sR0FBRztBQUNMLFVBQU1DLE1BQU0sR0FBRyxLQUFLVCxLQUFMLENBQVdTLE1BQVgsZ0JBQ1g7QUFBTSxNQUFBLFNBQVMsRUFBQztBQUFoQixPQUErQyxNQUFNLEtBQUtULEtBQUwsQ0FBV1MsTUFBakIsR0FBMEIsR0FBekUsQ0FEVyxHQUVYLElBRkosQ0FESyxDQUlMO0FBQ0E7QUFDQTs7QUFDQSx3QkFDSTtBQUFNLE1BQUEsU0FBUyxFQUFFLDBCQUEwQixLQUFLUixLQUFMLENBQVdDLE9BQVgsR0FBcUIsVUFBckIsR0FBa0MsRUFBNUQsQ0FBakI7QUFBa0YsTUFBQSxPQUFPLEVBQUUsS0FBS0MsYUFBTCxDQUFtQk8sSUFBbkIsQ0FBd0IsSUFBeEI7QUFBM0YsT0FDTUQsTUFETix1QkFHSTtBQUFNLE1BQUEsU0FBUyxFQUFDLDhCQUFoQjtBQUErQyxNQUFBLHVCQUF1QixFQUFFO0FBQUVFLFFBQUFBLE1BQU0sRUFBRSxLQUFLWCxLQUFMLENBQVdZO0FBQXJCO0FBQXhFLE1BSEosQ0FESjtBQU9IOztBQS9CZ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuIENvcHlyaWdodCAyMDE5IFNvcnVub21lXG5cbiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG4gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3BvaWxlciBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgdmlzaWJsZTogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdG9nZ2xlVmlzaWJsZShlKSB7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS52aXNpYmxlKSB7XG4gICAgICAgICAgICAvLyB3ZSBhcmUgdW4tYmx1cnJpbmcsIHdlIGRvbid0IHdhbnQgdGhpcyBjbGljayB0byBwcm9wYWdhdGUgdG8gcG90ZW50aWFsIGNoaWxkIHBpbGxzXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyB2aXNpYmxlOiAhdGhpcy5zdGF0ZS52aXNpYmxlIH0pO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgcmVhc29uID0gdGhpcy5wcm9wcy5yZWFzb24gPyAoXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9FdmVudFRpbGVfc3BvaWxlcl9yZWFzb25cIj57XCIoXCIgKyB0aGlzLnByb3BzLnJlYXNvbiArIFwiKVwifTwvc3Bhbj5cbiAgICAgICAgKSA6IG51bGw7XG4gICAgICAgIC8vIHJlYWN0IGRvZXNuJ3QgYWxsb3cgYXBwZW5kaW5nIGEgRE9NIG5vZGUgYXMgY2hpbGQuXG4gICAgICAgIC8vIGFzIHN1Y2gsIHdlIHBhc3MgdGhlIHRoaXMucHJvcHMuY29udGVudEh0bWwgaW5zdGVhZCBhbmQgdGhlbiBzZXQgdGhlIHJhd1xuICAgICAgICAvLyBIVE1MIGNvbnRlbnQuIFRoaXMgaXMgc2VjdXJlIGFzIHRoZSBjb250ZW50cyBoYXZlIGFscmVhZHkgYmVlbiBwYXJzZWQgcHJldmlvdXNseVxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtcIm14X0V2ZW50VGlsZV9zcG9pbGVyXCIgKyAodGhpcy5zdGF0ZS52aXNpYmxlID8gXCIgdmlzaWJsZVwiIDogXCJcIil9IG9uQ2xpY2s9e3RoaXMudG9nZ2xlVmlzaWJsZS5iaW5kKHRoaXMpfT5cbiAgICAgICAgICAgICAgICB7IHJlYXNvbiB9XG4gICAgICAgICAgICAgICAgJm5ic3A7XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfRXZlbnRUaWxlX3Nwb2lsZXJfY29udGVudFwiIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7IF9faHRtbDogdGhpcy5wcm9wcy5jb250ZW50SHRtbCB9fSAvPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==