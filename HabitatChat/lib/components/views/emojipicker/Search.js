"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../languageHandler");

/*
Copyright 2019 Tulir Asokan <tulir@maunium.net>

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
class Search extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    this.inputRef = _react.default.createRef();
  }

  componentDidMount() {
    // For some reason, neither the autoFocus nor just calling focus() here worked, so here's a setTimeout
    setTimeout(() => this.inputRef.current.focus(), 0);
  }

  render() {
    let rightButton;

    if (this.props.query) {
      rightButton = /*#__PURE__*/_react.default.createElement("button", {
        onClick: () => this.props.onChange(""),
        className: "mx_EmojiPicker_search_icon mx_EmojiPicker_search_clear",
        title: (0, _languageHandler._t)("Cancel search")
      });
    } else {
      rightButton = /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_EmojiPicker_search_icon"
      });
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_EmojiPicker_search"
    }, /*#__PURE__*/_react.default.createElement("input", {
      autoFocus: true,
      type: "text",
      placeholder: "Search",
      value: this.props.query,
      onChange: ev => this.props.onChange(ev.target.value),
      ref: this.inputRef
    }), rightButton);
  }

}

(0, _defineProperty2.default)(Search, "propTypes", {
  query: _propTypes.default.string.isRequired,
  onChange: _propTypes.default.func.isRequired
});
var _default = Search;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2Vtb2ppcGlja2VyL1NlYXJjaC5qcyJdLCJuYW1lcyI6WyJTZWFyY2giLCJSZWFjdCIsIlB1cmVDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwiaW5wdXRSZWYiLCJjcmVhdGVSZWYiLCJjb21wb25lbnREaWRNb3VudCIsInNldFRpbWVvdXQiLCJjdXJyZW50IiwiZm9jdXMiLCJyZW5kZXIiLCJyaWdodEJ1dHRvbiIsInF1ZXJ5Iiwib25DaGFuZ2UiLCJldiIsInRhcmdldCIsInZhbHVlIiwiUHJvcFR5cGVzIiwic3RyaW5nIiwiaXNSZXF1aXJlZCIsImZ1bmMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQWxCQTs7Ozs7Ozs7Ozs7Ozs7O0FBb0JBLE1BQU1BLE1BQU4sU0FBcUJDLGVBQU1DLGFBQTNCLENBQXlDO0FBTXJDQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUTtBQUNmLFVBQU1BLEtBQU47QUFDQSxTQUFLQyxRQUFMLEdBQWdCSixlQUFNSyxTQUFOLEVBQWhCO0FBQ0g7O0FBRURDLEVBQUFBLGlCQUFpQixHQUFHO0FBQ2hCO0FBQ0FDLElBQUFBLFVBQVUsQ0FBQyxNQUFNLEtBQUtILFFBQUwsQ0FBY0ksT0FBZCxDQUFzQkMsS0FBdEIsRUFBUCxFQUFzQyxDQUF0QyxDQUFWO0FBQ0g7O0FBRURDLEVBQUFBLE1BQU0sR0FBRztBQUNMLFFBQUlDLFdBQUo7O0FBQ0EsUUFBSSxLQUFLUixLQUFMLENBQVdTLEtBQWYsRUFBc0I7QUFDbEJELE1BQUFBLFdBQVcsZ0JBQ1A7QUFBUSxRQUFBLE9BQU8sRUFBRSxNQUFNLEtBQUtSLEtBQUwsQ0FBV1UsUUFBWCxDQUFvQixFQUFwQixDQUF2QjtBQUNRLFFBQUEsU0FBUyxFQUFDLHdEQURsQjtBQUVRLFFBQUEsS0FBSyxFQUFFLHlCQUFHLGVBQUg7QUFGZixRQURKO0FBS0gsS0FORCxNQU1PO0FBQ0hGLE1BQUFBLFdBQVcsZ0JBQUc7QUFBTSxRQUFBLFNBQVMsRUFBQztBQUFoQixRQUFkO0FBQ0g7O0FBRUQsd0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJO0FBQU8sTUFBQSxTQUFTLE1BQWhCO0FBQWlCLE1BQUEsSUFBSSxFQUFDLE1BQXRCO0FBQTZCLE1BQUEsV0FBVyxFQUFDLFFBQXpDO0FBQWtELE1BQUEsS0FBSyxFQUFFLEtBQUtSLEtBQUwsQ0FBV1MsS0FBcEU7QUFDSSxNQUFBLFFBQVEsRUFBRUUsRUFBRSxJQUFJLEtBQUtYLEtBQUwsQ0FBV1UsUUFBWCxDQUFvQkMsRUFBRSxDQUFDQyxNQUFILENBQVVDLEtBQTlCLENBRHBCO0FBQzBELE1BQUEsR0FBRyxFQUFFLEtBQUtaO0FBRHBFLE1BREosRUFHS08sV0FITCxDQURKO0FBT0g7O0FBbkNvQzs7OEJBQW5DWixNLGVBQ2lCO0FBQ2ZhLEVBQUFBLEtBQUssRUFBRUssbUJBQVVDLE1BQVYsQ0FBaUJDLFVBRFQ7QUFFZk4sRUFBQUEsUUFBUSxFQUFFSSxtQkFBVUcsSUFBVixDQUFlRDtBQUZWLEM7ZUFxQ1JwQixNIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IFR1bGlyIEFzb2thbiA8dHVsaXJAbWF1bml1bS5uZXQ+XG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5cbmNsYXNzIFNlYXJjaCBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIHF1ZXJ5OiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgICAgIG9uQ2hhbmdlOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIH07XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG4gICAgICAgIHRoaXMuaW5wdXRSZWYgPSBSZWFjdC5jcmVhdGVSZWYoKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgLy8gRm9yIHNvbWUgcmVhc29uLCBuZWl0aGVyIHRoZSBhdXRvRm9jdXMgbm9yIGp1c3QgY2FsbGluZyBmb2N1cygpIGhlcmUgd29ya2VkLCBzbyBoZXJlJ3MgYSBzZXRUaW1lb3V0XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5pbnB1dFJlZi5jdXJyZW50LmZvY3VzKCksIDApO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IHJpZ2h0QnV0dG9uO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5xdWVyeSkge1xuICAgICAgICAgICAgcmlnaHRCdXR0b24gPSAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiB0aGlzLnByb3BzLm9uQ2hhbmdlKFwiXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfRW1vamlQaWNrZXJfc2VhcmNoX2ljb24gbXhfRW1vamlQaWNrZXJfc2VhcmNoX2NsZWFyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtfdChcIkNhbmNlbCBzZWFyY2hcIil9IC8+XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmlnaHRCdXR0b24gPSA8c3BhbiBjbGFzc05hbWU9XCJteF9FbW9qaVBpY2tlcl9zZWFyY2hfaWNvblwiIC8+O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRW1vamlQaWNrZXJfc2VhcmNoXCI+XG4gICAgICAgICAgICAgICAgPGlucHV0IGF1dG9Gb2N1cyB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiU2VhcmNoXCIgdmFsdWU9e3RoaXMucHJvcHMucXVlcnl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtldiA9PiB0aGlzLnByb3BzLm9uQ2hhbmdlKGV2LnRhcmdldC52YWx1ZSl9IHJlZj17dGhpcy5pbnB1dFJlZn0gLz5cbiAgICAgICAgICAgICAgICB7cmlnaHRCdXR0b259XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNlYXJjaDtcbiJdfQ==