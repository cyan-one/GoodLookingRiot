"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _classnames = _interopRequireDefault(require("classnames"));

var _languageHandler = require("../../../languageHandler");

var _ErrorUtils = require("../../../utils/ErrorUtils");

/*
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
var _default = (0, _createReactClass.default)({
  displayName: "ServerLimitBar",
  propTypes: {
    // 'hard' if the logged in user has been locked out, 'soft' if they haven't
    kind: _propTypes.default.string,
    adminContact: _propTypes.default.string,
    // The type of limit that has been hit.
    limitType: _propTypes.default.string.isRequired
  },
  getDefaultProps: function () {
    return {
      kind: 'hard'
    };
  },
  render: function () {
    const toolbarClasses = {
      'mx_MatrixToolbar': true
    };
    let adminContact;
    let limitError;

    if (this.props.kind === 'hard') {
      toolbarClasses['mx_MatrixToolbar_error'] = true;
      adminContact = (0, _ErrorUtils.messageForResourceLimitError)(this.props.limitType, this.props.adminContact, {
        '': (0, _languageHandler._td)("Please <a>contact your service administrator</a> to continue using the service.")
      });
      limitError = (0, _ErrorUtils.messageForResourceLimitError)(this.props.limitType, this.props.adminContact, {
        'monthly_active_user': (0, _languageHandler._td)("This homeserver has hit its Monthly Active User limit."),
        '': (0, _languageHandler._td)("This homeserver has exceeded one of its resource limits.")
      });
    } else {
      toolbarClasses['mx_MatrixToolbar_info'] = true;
      adminContact = (0, _ErrorUtils.messageForResourceLimitError)(this.props.limitType, this.props.adminContact, {
        '': (0, _languageHandler._td)("Please <a>contact your service administrator</a> to get this limit increased.")
      });
      limitError = (0, _ErrorUtils.messageForResourceLimitError)(this.props.limitType, this.props.adminContact, {
        'monthly_active_user': (0, _languageHandler._td)("This homeserver has hit its Monthly Active User limit so " + "<b>some users will not be able to log in</b>."),
        '': (0, _languageHandler._td)("This homeserver has exceeded one of its resource limits so " + "<b>some users will not be able to log in</b>.")
      }, {
        'b': sub => /*#__PURE__*/_react.default.createElement("b", null, sub)
      });
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: (0, _classnames.default)(toolbarClasses)
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_MatrixToolbar_content"
    }, limitError, ' ', adminContact));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2dsb2JhbHMvU2VydmVyTGltaXRCYXIuanMiXSwibmFtZXMiOlsicHJvcFR5cGVzIiwia2luZCIsIlByb3BUeXBlcyIsInN0cmluZyIsImFkbWluQ29udGFjdCIsImxpbWl0VHlwZSIsImlzUmVxdWlyZWQiLCJnZXREZWZhdWx0UHJvcHMiLCJyZW5kZXIiLCJ0b29sYmFyQ2xhc3NlcyIsImxpbWl0RXJyb3IiLCJwcm9wcyIsInN1YiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXJCQTs7Ozs7Ozs7Ozs7Ozs7O2VBdUJlLCtCQUFpQjtBQUFBO0FBQzVCQSxFQUFBQSxTQUFTLEVBQUU7QUFDUDtBQUNBQyxJQUFBQSxJQUFJLEVBQUVDLG1CQUFVQyxNQUZUO0FBR1BDLElBQUFBLFlBQVksRUFBRUYsbUJBQVVDLE1BSGpCO0FBSVA7QUFDQUUsSUFBQUEsU0FBUyxFQUFFSCxtQkFBVUMsTUFBVixDQUFpQkc7QUFMckIsR0FEaUI7QUFTNUJDLEVBQUFBLGVBQWUsRUFBRSxZQUFXO0FBQ3hCLFdBQU87QUFDSE4sTUFBQUEsSUFBSSxFQUFFO0FBREgsS0FBUDtBQUdILEdBYjJCO0FBZTVCTyxFQUFBQSxNQUFNLEVBQUUsWUFBVztBQUNmLFVBQU1DLGNBQWMsR0FBRztBQUNuQiwwQkFBb0I7QUFERCxLQUF2QjtBQUlBLFFBQUlMLFlBQUo7QUFDQSxRQUFJTSxVQUFKOztBQUNBLFFBQUksS0FBS0MsS0FBTCxDQUFXVixJQUFYLEtBQW9CLE1BQXhCLEVBQWdDO0FBQzVCUSxNQUFBQSxjQUFjLENBQUMsd0JBQUQsQ0FBZCxHQUEyQyxJQUEzQztBQUVBTCxNQUFBQSxZQUFZLEdBQUcsOENBQ1gsS0FBS08sS0FBTCxDQUFXTixTQURBLEVBRVgsS0FBS00sS0FBTCxDQUFXUCxZQUZBLEVBR1g7QUFDSSxZQUFJLDBCQUFJLGlGQUFKO0FBRFIsT0FIVyxDQUFmO0FBT0FNLE1BQUFBLFVBQVUsR0FBRyw4Q0FDVCxLQUFLQyxLQUFMLENBQVdOLFNBREYsRUFFVCxLQUFLTSxLQUFMLENBQVdQLFlBRkYsRUFHVDtBQUNJLCtCQUF1QiwwQkFBSSx3REFBSixDQUQzQjtBQUVJLFlBQUksMEJBQUksMERBQUo7QUFGUixPQUhTLENBQWI7QUFRSCxLQWxCRCxNQWtCTztBQUNISyxNQUFBQSxjQUFjLENBQUMsdUJBQUQsQ0FBZCxHQUEwQyxJQUExQztBQUNBTCxNQUFBQSxZQUFZLEdBQUcsOENBQ1gsS0FBS08sS0FBTCxDQUFXTixTQURBLEVBRVgsS0FBS00sS0FBTCxDQUFXUCxZQUZBLEVBR1g7QUFDSSxZQUFJLDBCQUFJLCtFQUFKO0FBRFIsT0FIVyxDQUFmO0FBT0FNLE1BQUFBLFVBQVUsR0FBRyw4Q0FDVCxLQUFLQyxLQUFMLENBQVdOLFNBREYsRUFFVCxLQUFLTSxLQUFMLENBQVdQLFlBRkYsRUFHVDtBQUNJLCtCQUF1QiwwQkFDbkIsOERBQ0EsK0NBRm1CLENBRDNCO0FBS0ksWUFBSSwwQkFDQSxnRUFDQSwrQ0FGQTtBQUxSLE9BSFMsRUFhVDtBQUFDLGFBQUtRLEdBQUcsaUJBQUksd0NBQUlBLEdBQUo7QUFBYixPQWJTLENBQWI7QUFlSDs7QUFDRCx3QkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFFLHlCQUFXSCxjQUFYO0FBQWhCLG9CQUNJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixPQUNLQyxVQURMLEVBRUssR0FGTCxFQUdLTixZQUhMLENBREosQ0FESjtBQVNIO0FBMUUyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5pbXBvcnQgeyBfdGQgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IHsgbWVzc2FnZUZvclJlc291cmNlTGltaXRFcnJvciB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL0Vycm9yVXRpbHMnO1xuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgLy8gJ2hhcmQnIGlmIHRoZSBsb2dnZWQgaW4gdXNlciBoYXMgYmVlbiBsb2NrZWQgb3V0LCAnc29mdCcgaWYgdGhleSBoYXZlbid0XG4gICAgICAgIGtpbmQ6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIGFkbWluQ29udGFjdDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgLy8gVGhlIHR5cGUgb2YgbGltaXQgdGhhdCBoYXMgYmVlbiBoaXQuXG4gICAgICAgIGxpbWl0VHlwZTogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAga2luZDogJ2hhcmQnLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCB0b29sYmFyQ2xhc3NlcyA9IHtcbiAgICAgICAgICAgICdteF9NYXRyaXhUb29sYmFyJzogdHJ1ZSxcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgYWRtaW5Db250YWN0O1xuICAgICAgICBsZXQgbGltaXRFcnJvcjtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMua2luZCA9PT0gJ2hhcmQnKSB7XG4gICAgICAgICAgICB0b29sYmFyQ2xhc3Nlc1snbXhfTWF0cml4VG9vbGJhcl9lcnJvciddID0gdHJ1ZTtcblxuICAgICAgICAgICAgYWRtaW5Db250YWN0ID0gbWVzc2FnZUZvclJlc291cmNlTGltaXRFcnJvcihcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLmxpbWl0VHlwZSxcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLmFkbWluQ29udGFjdCxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICcnOiBfdGQoXCJQbGVhc2UgPGE+Y29udGFjdCB5b3VyIHNlcnZpY2UgYWRtaW5pc3RyYXRvcjwvYT4gdG8gY29udGludWUgdXNpbmcgdGhlIHNlcnZpY2UuXCIpLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbGltaXRFcnJvciA9IG1lc3NhZ2VGb3JSZXNvdXJjZUxpbWl0RXJyb3IoXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5saW1pdFR5cGUsXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5hZG1pbkNvbnRhY3QsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAnbW9udGhseV9hY3RpdmVfdXNlcic6IF90ZChcIlRoaXMgaG9tZXNlcnZlciBoYXMgaGl0IGl0cyBNb250aGx5IEFjdGl2ZSBVc2VyIGxpbWl0LlwiKSxcbiAgICAgICAgICAgICAgICAgICAgJyc6IF90ZChcIlRoaXMgaG9tZXNlcnZlciBoYXMgZXhjZWVkZWQgb25lIG9mIGl0cyByZXNvdXJjZSBsaW1pdHMuXCIpLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9vbGJhckNsYXNzZXNbJ214X01hdHJpeFRvb2xiYXJfaW5mbyddID0gdHJ1ZTtcbiAgICAgICAgICAgIGFkbWluQ29udGFjdCA9IG1lc3NhZ2VGb3JSZXNvdXJjZUxpbWl0RXJyb3IoXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5saW1pdFR5cGUsXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5hZG1pbkNvbnRhY3QsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAnJzogX3RkKFwiUGxlYXNlIDxhPmNvbnRhY3QgeW91ciBzZXJ2aWNlIGFkbWluaXN0cmF0b3I8L2E+IHRvIGdldCB0aGlzIGxpbWl0IGluY3JlYXNlZC5cIiksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBsaW1pdEVycm9yID0gbWVzc2FnZUZvclJlc291cmNlTGltaXRFcnJvcihcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLmxpbWl0VHlwZSxcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLmFkbWluQ29udGFjdCxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICdtb250aGx5X2FjdGl2ZV91c2VyJzogX3RkKFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUaGlzIGhvbWVzZXJ2ZXIgaGFzIGhpdCBpdHMgTW9udGhseSBBY3RpdmUgVXNlciBsaW1pdCBzbyBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxiPnNvbWUgdXNlcnMgd2lsbCBub3QgYmUgYWJsZSB0byBsb2cgaW48L2I+LlwiLFxuICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICAnJzogX3RkKFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUaGlzIGhvbWVzZXJ2ZXIgaGFzIGV4Y2VlZGVkIG9uZSBvZiBpdHMgcmVzb3VyY2UgbGltaXRzIHNvIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGI+c29tZSB1c2VycyB3aWxsIG5vdCBiZSBhYmxlIHRvIGxvZyBpbjwvYj4uXCIsXG4gICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7J2InOiBzdWIgPT4gPGI+e3N1Yn08L2I+fSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtjbGFzc05hbWVzKHRvb2xiYXJDbGFzc2VzKX0+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9NYXRyaXhUb29sYmFyX2NvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAge2xpbWl0RXJyb3J9XG4gICAgICAgICAgICAgICAgICAgIHsnICd9XG4gICAgICAgICAgICAgICAgICAgIHthZG1pbkNvbnRhY3R9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9LFxufSk7XG4iXX0=