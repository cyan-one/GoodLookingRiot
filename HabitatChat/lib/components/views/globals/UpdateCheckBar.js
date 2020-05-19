"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _languageHandler = require("../../../languageHandler");

var _PlatformPeg = _interopRequireDefault(require("../../../PlatformPeg"));

var _AccessibleButton = _interopRequireDefault(require("../../../components/views/elements/AccessibleButton"));

/*
Copyright 2017, 2019 Michael Telatynski <7t3chguy@gmail.com>

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
  displayName: "UpdateCheckBar",
  propTypes: {
    status: _propTypes.default.string.isRequired,
    // Currently for error detail but will be usable for download progress
    // once that is a thing that squirrel passes through electron.
    detail: _propTypes.default.string
  },
  getDefaultProps: function () {
    return {
      detail: ''
    };
  },
  getStatusText: function () {
    // we can't import the enum from riot-web as we don't want matrix-react-sdk
    // to depend on riot-web. so we grab it as a normal object via API instead.
    const updateCheckStatusEnum = _PlatformPeg.default.get().getUpdateCheckStatusEnum();

    switch (this.props.status) {
      case updateCheckStatusEnum.ERROR:
        return (0, _languageHandler._t)('Error encountered (%(errorDetail)s).', {
          errorDetail: this.props.detail
        });

      case updateCheckStatusEnum.CHECKING:
        return (0, _languageHandler._t)('Checking for an update...');

      case updateCheckStatusEnum.NOTAVAILABLE:
        return (0, _languageHandler._t)('No update available.');

      case updateCheckStatusEnum.DOWNLOADING:
        return (0, _languageHandler._t)('Downloading update...');
    }
  },
  hideToolbar: function () {
    _PlatformPeg.default.get().stopUpdateCheck();
  },
  render: function () {
    const message = this.getStatusText();
    const warning = (0, _languageHandler._t)('Warning');

    if (!('getUpdateCheckStatusEnum' in _PlatformPeg.default.get())) {
      return /*#__PURE__*/_react.default.createElement("div", null);
    }

    const updateCheckStatusEnum = _PlatformPeg.default.get().getUpdateCheckStatusEnum();

    const doneStatuses = [updateCheckStatusEnum.ERROR, updateCheckStatusEnum.NOTAVAILABLE];
    let image;

    if (doneStatuses.includes(this.props.status)) {
      image = /*#__PURE__*/_react.default.createElement("img", {
        className: "mx_MatrixToolbar_warning",
        src: require("../../../../res/img/warning.svg"),
        width: "24",
        height: "23",
        alt: ""
      });
    } else {
      image = /*#__PURE__*/_react.default.createElement("img", {
        className: "mx_MatrixToolbar_warning",
        src: require("../../../../res/img/spinner.gif"),
        width: "24",
        height: "23",
        alt: ""
      });
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MatrixToolbar"
    }, image, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MatrixToolbar_content"
    }, message), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      className: "mx_MatrixToolbar_close",
      onClick: this.hideToolbar
    }, /*#__PURE__*/_react.default.createElement("img", {
      src: require("../../../../res/img/cancel.svg"),
      width: "18",
      height: "18",
      alt: (0, _languageHandler._t)('Close')
    })));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2dsb2JhbHMvVXBkYXRlQ2hlY2tCYXIuanMiXSwibmFtZXMiOlsicHJvcFR5cGVzIiwic3RhdHVzIiwiUHJvcFR5cGVzIiwic3RyaW5nIiwiaXNSZXF1aXJlZCIsImRldGFpbCIsImdldERlZmF1bHRQcm9wcyIsImdldFN0YXR1c1RleHQiLCJ1cGRhdGVDaGVja1N0YXR1c0VudW0iLCJQbGF0Zm9ybVBlZyIsImdldCIsImdldFVwZGF0ZUNoZWNrU3RhdHVzRW51bSIsInByb3BzIiwiRVJST1IiLCJlcnJvckRldGFpbCIsIkNIRUNLSU5HIiwiTk9UQVZBSUxBQkxFIiwiRE9XTkxPQURJTkciLCJoaWRlVG9vbGJhciIsInN0b3BVcGRhdGVDaGVjayIsInJlbmRlciIsIm1lc3NhZ2UiLCJ3YXJuaW5nIiwiZG9uZVN0YXR1c2VzIiwiaW1hZ2UiLCJpbmNsdWRlcyIsInJlcXVpcmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFyQkE7Ozs7Ozs7Ozs7Ozs7OztlQXVCZSwrQkFBaUI7QUFBQTtBQUM1QkEsRUFBQUEsU0FBUyxFQUFFO0FBQ1BDLElBQUFBLE1BQU0sRUFBRUMsbUJBQVVDLE1BQVYsQ0FBaUJDLFVBRGxCO0FBRVA7QUFDQTtBQUNBQyxJQUFBQSxNQUFNLEVBQUVILG1CQUFVQztBQUpYLEdBRGlCO0FBUTVCRyxFQUFBQSxlQUFlLEVBQUUsWUFBVztBQUN4QixXQUFPO0FBQ0hELE1BQUFBLE1BQU0sRUFBRTtBQURMLEtBQVA7QUFHSCxHQVoyQjtBQWM1QkUsRUFBQUEsYUFBYSxFQUFFLFlBQVc7QUFDdEI7QUFDQTtBQUNBLFVBQU1DLHFCQUFxQixHQUFHQyxxQkFBWUMsR0FBWixHQUFrQkMsd0JBQWxCLEVBQTlCOztBQUNBLFlBQVEsS0FBS0MsS0FBTCxDQUFXWCxNQUFuQjtBQUNJLFdBQUtPLHFCQUFxQixDQUFDSyxLQUEzQjtBQUNJLGVBQU8seUJBQUcsc0NBQUgsRUFBMkM7QUFBRUMsVUFBQUEsV0FBVyxFQUFFLEtBQUtGLEtBQUwsQ0FBV1A7QUFBMUIsU0FBM0MsQ0FBUDs7QUFDSixXQUFLRyxxQkFBcUIsQ0FBQ08sUUFBM0I7QUFDSSxlQUFPLHlCQUFHLDJCQUFILENBQVA7O0FBQ0osV0FBS1AscUJBQXFCLENBQUNRLFlBQTNCO0FBQ0ksZUFBTyx5QkFBRyxzQkFBSCxDQUFQOztBQUNKLFdBQUtSLHFCQUFxQixDQUFDUyxXQUEzQjtBQUNJLGVBQU8seUJBQUcsdUJBQUgsQ0FBUDtBQVJSO0FBVUgsR0E1QjJCO0FBOEI1QkMsRUFBQUEsV0FBVyxFQUFFLFlBQVc7QUFDcEJULHlCQUFZQyxHQUFaLEdBQWtCUyxlQUFsQjtBQUNILEdBaEMyQjtBQWtDNUJDLEVBQUFBLE1BQU0sRUFBRSxZQUFXO0FBQ2YsVUFBTUMsT0FBTyxHQUFHLEtBQUtkLGFBQUwsRUFBaEI7QUFDQSxVQUFNZSxPQUFPLEdBQUcseUJBQUcsU0FBSCxDQUFoQjs7QUFFQSxRQUFJLEVBQUUsOEJBQThCYixxQkFBWUMsR0FBWixFQUFoQyxDQUFKLEVBQXdEO0FBQ3BELDBCQUFPLHlDQUFQO0FBQ0g7O0FBRUQsVUFBTUYscUJBQXFCLEdBQUdDLHFCQUFZQyxHQUFaLEdBQWtCQyx3QkFBbEIsRUFBOUI7O0FBQ0EsVUFBTVksWUFBWSxHQUFHLENBQ2pCZixxQkFBcUIsQ0FBQ0ssS0FETCxFQUVqQkwscUJBQXFCLENBQUNRLFlBRkwsQ0FBckI7QUFLQSxRQUFJUSxLQUFKOztBQUNBLFFBQUlELFlBQVksQ0FBQ0UsUUFBYixDQUFzQixLQUFLYixLQUFMLENBQVdYLE1BQWpDLENBQUosRUFBOEM7QUFDMUN1QixNQUFBQSxLQUFLLGdCQUFHO0FBQUssUUFBQSxTQUFTLEVBQUMsMEJBQWY7QUFBMEMsUUFBQSxHQUFHLEVBQUVFLE9BQU8sQ0FBQyxpQ0FBRCxDQUF0RDtBQUEyRixRQUFBLEtBQUssRUFBQyxJQUFqRztBQUFzRyxRQUFBLE1BQU0sRUFBQyxJQUE3RztBQUFrSCxRQUFBLEdBQUcsRUFBQztBQUF0SCxRQUFSO0FBQ0gsS0FGRCxNQUVPO0FBQ0hGLE1BQUFBLEtBQUssZ0JBQUc7QUFBSyxRQUFBLFNBQVMsRUFBQywwQkFBZjtBQUEwQyxRQUFBLEdBQUcsRUFBRUUsT0FBTyxDQUFDLGlDQUFELENBQXREO0FBQTJGLFFBQUEsS0FBSyxFQUFDLElBQWpHO0FBQXNHLFFBQUEsTUFBTSxFQUFDLElBQTdHO0FBQWtILFFBQUEsR0FBRyxFQUFDO0FBQXRILFFBQVI7QUFDSDs7QUFFRCx3QkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDS0YsS0FETCxlQUVJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixPQUNLSCxPQURMLENBRkosZUFLSSw2QkFBQyx5QkFBRDtBQUFrQixNQUFBLFNBQVMsRUFBQyx3QkFBNUI7QUFBcUQsTUFBQSxPQUFPLEVBQUUsS0FBS0g7QUFBbkUsb0JBQ0k7QUFBSyxNQUFBLEdBQUcsRUFBRVEsT0FBTyxDQUFDLGdDQUFELENBQWpCO0FBQXFELE1BQUEsS0FBSyxFQUFDLElBQTNEO0FBQWdFLE1BQUEsTUFBTSxFQUFDLElBQXZFO0FBQTRFLE1BQUEsR0FBRyxFQUFFLHlCQUFHLE9BQUg7QUFBakYsTUFESixDQUxKLENBREo7QUFXSDtBQWxFMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNywgMjAxOSBNaWNoYWVsIFRlbGF0eW5za2kgPDd0M2NoZ3V5QGdtYWlsLmNvbT5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgUGxhdGZvcm1QZWcgZnJvbSAnLi4vLi4vLi4vUGxhdGZvcm1QZWcnO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSAnLi4vLi4vLi4vY29tcG9uZW50cy92aWV3cy9lbGVtZW50cy9BY2Nlc3NpYmxlQnV0dG9uJztcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIHN0YXR1czogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICAvLyBDdXJyZW50bHkgZm9yIGVycm9yIGRldGFpbCBidXQgd2lsbCBiZSB1c2FibGUgZm9yIGRvd25sb2FkIHByb2dyZXNzXG4gICAgICAgIC8vIG9uY2UgdGhhdCBpcyBhIHRoaW5nIHRoYXQgc3F1aXJyZWwgcGFzc2VzIHRocm91Z2ggZWxlY3Ryb24uXG4gICAgICAgIGRldGFpbDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICB9LFxuXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRldGFpbDogJycsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldFN0YXR1c1RleHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyB3ZSBjYW4ndCBpbXBvcnQgdGhlIGVudW0gZnJvbSByaW90LXdlYiBhcyB3ZSBkb24ndCB3YW50IG1hdHJpeC1yZWFjdC1zZGtcbiAgICAgICAgLy8gdG8gZGVwZW5kIG9uIHJpb3Qtd2ViLiBzbyB3ZSBncmFiIGl0IGFzIGEgbm9ybWFsIG9iamVjdCB2aWEgQVBJIGluc3RlYWQuXG4gICAgICAgIGNvbnN0IHVwZGF0ZUNoZWNrU3RhdHVzRW51bSA9IFBsYXRmb3JtUGVnLmdldCgpLmdldFVwZGF0ZUNoZWNrU3RhdHVzRW51bSgpO1xuICAgICAgICBzd2l0Y2ggKHRoaXMucHJvcHMuc3RhdHVzKSB7XG4gICAgICAgICAgICBjYXNlIHVwZGF0ZUNoZWNrU3RhdHVzRW51bS5FUlJPUjpcbiAgICAgICAgICAgICAgICByZXR1cm4gX3QoJ0Vycm9yIGVuY291bnRlcmVkICglKGVycm9yRGV0YWlsKXMpLicsIHsgZXJyb3JEZXRhaWw6IHRoaXMucHJvcHMuZGV0YWlsIH0pO1xuICAgICAgICAgICAgY2FzZSB1cGRhdGVDaGVja1N0YXR1c0VudW0uQ0hFQ0tJTkc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90KCdDaGVja2luZyBmb3IgYW4gdXBkYXRlLi4uJyk7XG4gICAgICAgICAgICBjYXNlIHVwZGF0ZUNoZWNrU3RhdHVzRW51bS5OT1RBVkFJTEFCTEU6XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90KCdObyB1cGRhdGUgYXZhaWxhYmxlLicpO1xuICAgICAgICAgICAgY2FzZSB1cGRhdGVDaGVja1N0YXR1c0VudW0uRE9XTkxPQURJTkc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90KCdEb3dubG9hZGluZyB1cGRhdGUuLi4nKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBoaWRlVG9vbGJhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIFBsYXRmb3JtUGVnLmdldCgpLnN0b3BVcGRhdGVDaGVjaygpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5nZXRTdGF0dXNUZXh0KCk7XG4gICAgICAgIGNvbnN0IHdhcm5pbmcgPSBfdCgnV2FybmluZycpO1xuXG4gICAgICAgIGlmICghKCdnZXRVcGRhdGVDaGVja1N0YXR1c0VudW0nIGluIFBsYXRmb3JtUGVnLmdldCgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIDxkaXY+PC9kaXY+O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdXBkYXRlQ2hlY2tTdGF0dXNFbnVtID0gUGxhdGZvcm1QZWcuZ2V0KCkuZ2V0VXBkYXRlQ2hlY2tTdGF0dXNFbnVtKCk7XG4gICAgICAgIGNvbnN0IGRvbmVTdGF0dXNlcyA9IFtcbiAgICAgICAgICAgIHVwZGF0ZUNoZWNrU3RhdHVzRW51bS5FUlJPUixcbiAgICAgICAgICAgIHVwZGF0ZUNoZWNrU3RhdHVzRW51bS5OT1RBVkFJTEFCTEUsXG4gICAgICAgIF07XG5cbiAgICAgICAgbGV0IGltYWdlO1xuICAgICAgICBpZiAoZG9uZVN0YXR1c2VzLmluY2x1ZGVzKHRoaXMucHJvcHMuc3RhdHVzKSkge1xuICAgICAgICAgICAgaW1hZ2UgPSA8aW1nIGNsYXNzTmFtZT1cIm14X01hdHJpeFRvb2xiYXJfd2FybmluZ1wiIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvd2FybmluZy5zdmdcIil9IHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyM1wiIGFsdD1cIlwiIC8+O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW1hZ2UgPSA8aW1nIGNsYXNzTmFtZT1cIm14X01hdHJpeFRvb2xiYXJfd2FybmluZ1wiIHNyYz17cmVxdWlyZShcIi4uLy4uLy4uLy4uL3Jlcy9pbWcvc3Bpbm5lci5naWZcIil9IHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyM1wiIGFsdD1cIlwiIC8+O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTWF0cml4VG9vbGJhclwiPlxuICAgICAgICAgICAgICAgIHtpbWFnZX1cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X01hdHJpeFRvb2xiYXJfY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICB7bWVzc2FnZX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBjbGFzc05hbWU9XCJteF9NYXRyaXhUb29sYmFyX2Nsb3NlXCIgb25DbGljaz17dGhpcy5oaWRlVG9vbGJhcn0+XG4gICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9jYW5jZWwuc3ZnXCIpfSB3aWR0aD1cIjE4XCIgaGVpZ2h0PVwiMThcIiBhbHQ9e190KCdDbG9zZScpfSAvPlxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==