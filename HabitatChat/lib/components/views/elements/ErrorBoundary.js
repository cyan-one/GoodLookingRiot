"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _PlatformPeg = _interopRequireDefault(require("../../../PlatformPeg"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

/*
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

/**
 * This error boundary component can be used to wrap large content areas and
 * catch exceptions during rendering in the component tree below them.
 */
class ErrorBoundary extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onClearCacheAndReload", () => {
      if (!_PlatformPeg.default.get()) return;

      _MatrixClientPeg.MatrixClientPeg.get().stopClient();

      _MatrixClientPeg.MatrixClientPeg.get().store.deleteAllData().then(() => {
        _PlatformPeg.default.get().reload();
      });
    });
    (0, _defineProperty2.default)(this, "_onBugReport", () => {
      const BugReportDialog = sdk.getComponent("dialogs.BugReportDialog");

      if (!BugReportDialog) {
        return;
      }

      _Modal.default.createTrackedDialog('Bug Report Dialog', '', BugReportDialog, {
        label: 'react-soft-crash'
      });
    });
    this.state = {
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    // Side effects are not permitted here, so we only update the state so
    // that the next render shows an error message.
    return {
      error
    };
  }

  componentDidCatch(error, {
    componentStack
  }) {
    // Browser consoles are better at formatting output when native errors are passed
    // in their own `console.error` invocation.
    console.error(error);
    console.error("The above error occured while React was rendering the following components:", componentStack);
  }

  render() {
    if (this.state.error) {
      const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
      const newIssueUrl = "https://github.com/vector-im/riot-web/issues/new";
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_ErrorBoundary"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_ErrorBoundary_body"
      }, /*#__PURE__*/_react.default.createElement("h1", null, (0, _languageHandler._t)("Something went wrong!")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Please <newIssueLink>create a new issue</newIssueLink> " + "on GitHub so that we can investigate this bug.", {}, {
        newIssueLink: sub => {
          return /*#__PURE__*/_react.default.createElement("a", {
            target: "_blank",
            rel: "noreferrer noopener",
            href: newIssueUrl
          }, sub);
        }
      })), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("If you've submitted a bug via GitHub, debug logs can help " + "us track down the problem. Debug logs contain application " + "usage data including your username, the IDs or aliases of " + "the rooms or groups you have visited and the usernames of " + "other users. They do not contain messages.")), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        onClick: this._onBugReport,
        kind: "primary"
      }, (0, _languageHandler._t)("Submit debug logs")), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        onClick: this._onClearCacheAndReload,
        kind: "danger"
      }, (0, _languageHandler._t)("Clear cache and reload"))));
    }

    return this.props.children;
  }

}

exports.default = ErrorBoundary;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL0Vycm9yQm91bmRhcnkuanMiXSwibmFtZXMiOlsiRXJyb3JCb3VuZGFyeSIsIlJlYWN0IiwiUHVyZUNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJQbGF0Zm9ybVBlZyIsImdldCIsIk1hdHJpeENsaWVudFBlZyIsInN0b3BDbGllbnQiLCJzdG9yZSIsImRlbGV0ZUFsbERhdGEiLCJ0aGVuIiwicmVsb2FkIiwiQnVnUmVwb3J0RGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwibGFiZWwiLCJzdGF0ZSIsImVycm9yIiwiZ2V0RGVyaXZlZFN0YXRlRnJvbUVycm9yIiwiY29tcG9uZW50RGlkQ2F0Y2giLCJjb21wb25lbnRTdGFjayIsImNvbnNvbGUiLCJyZW5kZXIiLCJBY2Nlc3NpYmxlQnV0dG9uIiwibmV3SXNzdWVVcmwiLCJuZXdJc3N1ZUxpbmsiLCJzdWIiLCJfb25CdWdSZXBvcnQiLCJfb25DbGVhckNhY2hlQW5kUmVsb2FkIiwiY2hpbGRyZW4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBckJBOzs7Ozs7Ozs7Ozs7Ozs7O0FBdUJBOzs7O0FBSWUsTUFBTUEsYUFBTixTQUE0QkMsZUFBTUMsYUFBbEMsQ0FBZ0Q7QUFDM0RDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFRO0FBQ2YsVUFBTUEsS0FBTjtBQURlLGtFQXdCTSxNQUFNO0FBQzNCLFVBQUksQ0FBQ0MscUJBQVlDLEdBQVosRUFBTCxFQUF3Qjs7QUFFeEJDLHVDQUFnQkQsR0FBaEIsR0FBc0JFLFVBQXRCOztBQUNBRCx1Q0FBZ0JELEdBQWhCLEdBQXNCRyxLQUF0QixDQUE0QkMsYUFBNUIsR0FBNENDLElBQTVDLENBQWlELE1BQU07QUFDbkROLDZCQUFZQyxHQUFaLEdBQWtCTSxNQUFsQjtBQUNILE9BRkQ7QUFHSCxLQS9Ca0I7QUFBQSx3REFpQ0osTUFBTTtBQUNqQixZQUFNQyxlQUFlLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQix5QkFBakIsQ0FBeEI7O0FBQ0EsVUFBSSxDQUFDRixlQUFMLEVBQXNCO0FBQ2xCO0FBQ0g7O0FBQ0RHLHFCQUFNQyxtQkFBTixDQUEwQixtQkFBMUIsRUFBK0MsRUFBL0MsRUFBbURKLGVBQW5ELEVBQW9FO0FBQ2hFSyxRQUFBQSxLQUFLLEVBQUU7QUFEeUQsT0FBcEU7QUFHSCxLQXpDa0I7QUFHZixTQUFLQyxLQUFMLEdBQWE7QUFDVEMsTUFBQUEsS0FBSyxFQUFFO0FBREUsS0FBYjtBQUdIOztBQUVELFNBQU9DLHdCQUFQLENBQWdDRCxLQUFoQyxFQUF1QztBQUNuQztBQUNBO0FBQ0EsV0FBTztBQUFFQSxNQUFBQTtBQUFGLEtBQVA7QUFDSDs7QUFFREUsRUFBQUEsaUJBQWlCLENBQUNGLEtBQUQsRUFBUTtBQUFFRyxJQUFBQTtBQUFGLEdBQVIsRUFBNEI7QUFDekM7QUFDQTtBQUNBQyxJQUFBQSxPQUFPLENBQUNKLEtBQVIsQ0FBY0EsS0FBZDtBQUNBSSxJQUFBQSxPQUFPLENBQUNKLEtBQVIsQ0FDSSw2RUFESixFQUVJRyxjQUZKO0FBSUg7O0FBcUJERSxFQUFBQSxNQUFNLEdBQUc7QUFDTCxRQUFJLEtBQUtOLEtBQUwsQ0FBV0MsS0FBZixFQUFzQjtBQUNsQixZQUFNTSxnQkFBZ0IsR0FBR1osR0FBRyxDQUFDQyxZQUFKLENBQWlCLDJCQUFqQixDQUF6QjtBQUNBLFlBQU1ZLFdBQVcsR0FBRyxrREFBcEI7QUFDQSwwQkFBTztBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsc0JBQ0g7QUFBSyxRQUFBLFNBQVMsRUFBQztBQUFmLHNCQUNJLHlDQUFLLHlCQUFHLHVCQUFILENBQUwsQ0FESixlQUVJLHdDQUFJLHlCQUNBLDREQUNBLGdEQUZBLEVBRWtELEVBRmxELEVBRXNEO0FBQ2xEQyxRQUFBQSxZQUFZLEVBQUdDLEdBQUQsSUFBUztBQUNuQiw4QkFBTztBQUFHLFlBQUEsTUFBTSxFQUFDLFFBQVY7QUFBbUIsWUFBQSxHQUFHLEVBQUMscUJBQXZCO0FBQTZDLFlBQUEsSUFBSSxFQUFFRjtBQUFuRCxhQUFrRUUsR0FBbEUsQ0FBUDtBQUNIO0FBSGlELE9BRnRELENBQUosQ0FGSixlQVVJLHdDQUFJLHlCQUNBLCtEQUNBLDREQURBLEdBRUEsNERBRkEsR0FHQSw0REFIQSxHQUlBLDRDQUxBLENBQUosQ0FWSixlQWlCSSw2QkFBQyxnQkFBRDtBQUFrQixRQUFBLE9BQU8sRUFBRSxLQUFLQyxZQUFoQztBQUE4QyxRQUFBLElBQUksRUFBQztBQUFuRCxTQUNLLHlCQUFHLG1CQUFILENBREwsQ0FqQkosZUFvQkksNkJBQUMsZ0JBQUQ7QUFBa0IsUUFBQSxPQUFPLEVBQUUsS0FBS0Msc0JBQWhDO0FBQXdELFFBQUEsSUFBSSxFQUFDO0FBQTdELFNBQ0sseUJBQUcsd0JBQUgsQ0FETCxDQXBCSixDQURHLENBQVA7QUEwQkg7O0FBRUQsV0FBTyxLQUFLM0IsS0FBTCxDQUFXNEIsUUFBbEI7QUFDSDs7QUE3RTBEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCBQbGF0Zm9ybVBlZyBmcm9tICcuLi8uLi8uLi9QbGF0Zm9ybVBlZyc7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi4vLi4vLi4vTW9kYWwnO1xuXG4vKipcbiAqIFRoaXMgZXJyb3IgYm91bmRhcnkgY29tcG9uZW50IGNhbiBiZSB1c2VkIHRvIHdyYXAgbGFyZ2UgY29udGVudCBhcmVhcyBhbmRcbiAqIGNhdGNoIGV4Y2VwdGlvbnMgZHVyaW5nIHJlbmRlcmluZyBpbiB0aGUgY29tcG9uZW50IHRyZWUgYmVsb3cgdGhlbS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRXJyb3JCb3VuZGFyeSBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgc3RhdGljIGdldERlcml2ZWRTdGF0ZUZyb21FcnJvcihlcnJvcikge1xuICAgICAgICAvLyBTaWRlIGVmZmVjdHMgYXJlIG5vdCBwZXJtaXR0ZWQgaGVyZSwgc28gd2Ugb25seSB1cGRhdGUgdGhlIHN0YXRlIHNvXG4gICAgICAgIC8vIHRoYXQgdGhlIG5leHQgcmVuZGVyIHNob3dzIGFuIGVycm9yIG1lc3NhZ2UuXG4gICAgICAgIHJldHVybiB7IGVycm9yIH07XG4gICAgfVxuXG4gICAgY29tcG9uZW50RGlkQ2F0Y2goZXJyb3IsIHsgY29tcG9uZW50U3RhY2sgfSkge1xuICAgICAgICAvLyBCcm93c2VyIGNvbnNvbGVzIGFyZSBiZXR0ZXIgYXQgZm9ybWF0dGluZyBvdXRwdXQgd2hlbiBuYXRpdmUgZXJyb3JzIGFyZSBwYXNzZWRcbiAgICAgICAgLy8gaW4gdGhlaXIgb3duIGBjb25zb2xlLmVycm9yYCBpbnZvY2F0aW9uLlxuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgIFwiVGhlIGFib3ZlIGVycm9yIG9jY3VyZWQgd2hpbGUgUmVhY3Qgd2FzIHJlbmRlcmluZyB0aGUgZm9sbG93aW5nIGNvbXBvbmVudHM6XCIsXG4gICAgICAgICAgICBjb21wb25lbnRTdGFjayxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBfb25DbGVhckNhY2hlQW5kUmVsb2FkID0gKCkgPT4ge1xuICAgICAgICBpZiAoIVBsYXRmb3JtUGVnLmdldCgpKSByZXR1cm47XG5cbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnN0b3BDbGllbnQoKTtcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnN0b3JlLmRlbGV0ZUFsbERhdGEoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIFBsYXRmb3JtUGVnLmdldCgpLnJlbG9hZCgpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgX29uQnVnUmVwb3J0ID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBCdWdSZXBvcnREaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5CdWdSZXBvcnREaWFsb2dcIik7XG4gICAgICAgIGlmICghQnVnUmVwb3J0RGlhbG9nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnQnVnIFJlcG9ydCBEaWFsb2cnLCAnJywgQnVnUmVwb3J0RGlhbG9nLCB7XG4gICAgICAgICAgICBsYWJlbDogJ3JlYWN0LXNvZnQtY3Jhc2gnLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5lcnJvcikge1xuICAgICAgICAgICAgY29uc3QgQWNjZXNzaWJsZUJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkFjY2Vzc2libGVCdXR0b24nKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0lzc3VlVXJsID0gXCJodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3Jpb3Qtd2ViL2lzc3Vlcy9uZXdcIjtcbiAgICAgICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cIm14X0Vycm9yQm91bmRhcnlcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0Vycm9yQm91bmRhcnlfYm9keVwiPlxuICAgICAgICAgICAgICAgICAgICA8aDE+e190KFwiU29tZXRoaW5nIHdlbnQgd3JvbmchXCIpfTwvaDE+XG4gICAgICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiUGxlYXNlIDxuZXdJc3N1ZUxpbms+Y3JlYXRlIGEgbmV3IGlzc3VlPC9uZXdJc3N1ZUxpbms+IFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwib24gR2l0SHViIHNvIHRoYXQgd2UgY2FuIGludmVzdGlnYXRlIHRoaXMgYnVnLlwiLCB7fSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0lzc3VlTGluazogKHN1YikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gPGEgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiIGhyZWY9e25ld0lzc3VlVXJsfT57IHN1YiB9PC9hPjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgKX08L3A+XG4gICAgICAgICAgICAgICAgICAgIDxwPntfdChcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiSWYgeW91J3ZlIHN1Ym1pdHRlZCBhIGJ1ZyB2aWEgR2l0SHViLCBkZWJ1ZyBsb2dzIGNhbiBoZWxwIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXMgdHJhY2sgZG93biB0aGUgcHJvYmxlbS4gRGVidWcgbG9ncyBjb250YWluIGFwcGxpY2F0aW9uIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXNhZ2UgZGF0YSBpbmNsdWRpbmcgeW91ciB1c2VybmFtZSwgdGhlIElEcyBvciBhbGlhc2VzIG9mIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGhlIHJvb21zIG9yIGdyb3VwcyB5b3UgaGF2ZSB2aXNpdGVkIGFuZCB0aGUgdXNlcm5hbWVzIG9mIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwib3RoZXIgdXNlcnMuIFRoZXkgZG8gbm90IGNvbnRhaW4gbWVzc2FnZXMuXCIsXG4gICAgICAgICAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vbkJ1Z1JlcG9ydH0ga2luZD0ncHJpbWFyeSc+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJTdWJtaXQgZGVidWcgbG9nc1wiKX1cbiAgICAgICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vbkNsZWFyQ2FjaGVBbmRSZWxvYWR9IGtpbmQ9J2Rhbmdlcic+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJDbGVhciBjYWNoZSBhbmQgcmVsb2FkXCIpfVxuICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5wcm9wcy5jaGlsZHJlbjtcbiAgICB9XG59XG4iXX0=