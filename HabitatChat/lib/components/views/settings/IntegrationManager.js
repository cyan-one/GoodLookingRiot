"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _Keyboard = require("../../../Keyboard");

/*
Copyright 2015, 2016 OpenMarket Ltd
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
class IntegrationManager extends _react.default.Component {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "onKeyDown", ev => {
      if (ev.key === _Keyboard.Key.ESCAPE) {
        ev.stopPropagation();
        ev.preventDefault();
        this.props.onFinished();
      }
    });
    (0, _defineProperty2.default)(this, "onAction", payload => {
      if (payload.action === 'close_scalar') {
        this.props.onFinished();
      }
    });
  }

  componentDidMount() {
    this.dispatcherRef = _dispatcher.default.register(this.onAction);
    document.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount() {
    _dispatcher.default.unregister(this.dispatcherRef);

    document.removeEventListener("keydown", this.onKeyDown);
  }

  render() {
    if (this.props.loading) {
      const Spinner = sdk.getComponent("elements.Spinner");
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_IntegrationManager_loading"
      }, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Connecting to integration manager...")), /*#__PURE__*/_react.default.createElement(Spinner, null));
    }

    if (!this.props.connected) {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_IntegrationManager_error"
      }, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Cannot connect to integration manager")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("The integration manager is offline or it cannot reach your homeserver.")));
    }

    return /*#__PURE__*/_react.default.createElement("iframe", {
      src: this.props.url
    });
  }

}

exports.default = IntegrationManager;
(0, _defineProperty2.default)(IntegrationManager, "propTypes", {
  // false to display an error saying that we couldn't connect to the integration manager
  connected: _propTypes.default.bool.isRequired,
  // true to display a loading spinner
  loading: _propTypes.default.bool.isRequired,
  // The source URL to load
  url: _propTypes.default.string,
  // callback when the manager is dismissed
  onFinished: _propTypes.default.func.isRequired
});
(0, _defineProperty2.default)(IntegrationManager, "defaultProps", {
  connected: true,
  loading: false
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL0ludGVncmF0aW9uTWFuYWdlci5qcyJdLCJuYW1lcyI6WyJJbnRlZ3JhdGlvbk1hbmFnZXIiLCJSZWFjdCIsIkNvbXBvbmVudCIsImV2Iiwia2V5IiwiS2V5IiwiRVNDQVBFIiwic3RvcFByb3BhZ2F0aW9uIiwicHJldmVudERlZmF1bHQiLCJwcm9wcyIsIm9uRmluaXNoZWQiLCJwYXlsb2FkIiwiYWN0aW9uIiwiY29tcG9uZW50RGlkTW91bnQiLCJkaXNwYXRjaGVyUmVmIiwiZGlzIiwicmVnaXN0ZXIiLCJvbkFjdGlvbiIsImRvY3VtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsIm9uS2V5RG93biIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwidW5yZWdpc3RlciIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJyZW5kZXIiLCJsb2FkaW5nIiwiU3Bpbm5lciIsInNkayIsImdldENvbXBvbmVudCIsImNvbm5lY3RlZCIsInVybCIsIlByb3BUeXBlcyIsImJvb2wiLCJpc1JlcXVpcmVkIiwic3RyaW5nIiwiZnVuYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF0QkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUF3QmUsTUFBTUEsa0JBQU4sU0FBaUNDLGVBQU1DLFNBQXZDLENBQWlEO0FBQUE7QUFBQTtBQUFBLHFEQThCL0NDLEVBQUQsSUFBUTtBQUNoQixVQUFJQSxFQUFFLENBQUNDLEdBQUgsS0FBV0MsY0FBSUMsTUFBbkIsRUFBMkI7QUFDdkJILFFBQUFBLEVBQUUsQ0FBQ0ksZUFBSDtBQUNBSixRQUFBQSxFQUFFLENBQUNLLGNBQUg7QUFDQSxhQUFLQyxLQUFMLENBQVdDLFVBQVg7QUFDSDtBQUNKLEtBcEMyRDtBQUFBLG9EQXNDaERDLE9BQUQsSUFBYTtBQUNwQixVQUFJQSxPQUFPLENBQUNDLE1BQVIsS0FBbUIsY0FBdkIsRUFBdUM7QUFDbkMsYUFBS0gsS0FBTCxDQUFXQyxVQUFYO0FBQ0g7QUFDSixLQTFDMkQ7QUFBQTs7QUFvQjVERyxFQUFBQSxpQkFBaUIsR0FBRztBQUNoQixTQUFLQyxhQUFMLEdBQXFCQyxvQkFBSUMsUUFBSixDQUFhLEtBQUtDLFFBQWxCLENBQXJCO0FBQ0FDLElBQUFBLFFBQVEsQ0FBQ0MsZ0JBQVQsQ0FBMEIsU0FBMUIsRUFBcUMsS0FBS0MsU0FBMUM7QUFDSDs7QUFFREMsRUFBQUEsb0JBQW9CLEdBQUc7QUFDbkJOLHdCQUFJTyxVQUFKLENBQWUsS0FBS1IsYUFBcEI7O0FBQ0FJLElBQUFBLFFBQVEsQ0FBQ0ssbUJBQVQsQ0FBNkIsU0FBN0IsRUFBd0MsS0FBS0gsU0FBN0M7QUFDSDs7QUFnQkRJLEVBQUFBLE1BQU0sR0FBRztBQUNMLFFBQUksS0FBS2YsS0FBTCxDQUFXZ0IsT0FBZixFQUF3QjtBQUNwQixZQUFNQyxPQUFPLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQixrQkFBakIsQ0FBaEI7QUFDQSwwQkFDSTtBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsc0JBQ0kseUNBQUsseUJBQUcsc0NBQUgsQ0FBTCxDQURKLGVBRUksNkJBQUMsT0FBRCxPQUZKLENBREo7QUFNSDs7QUFFRCxRQUFJLENBQUMsS0FBS25CLEtBQUwsQ0FBV29CLFNBQWhCLEVBQTJCO0FBQ3ZCLDBCQUNJO0FBQUssUUFBQSxTQUFTLEVBQUM7QUFBZixzQkFDSSx5Q0FBSyx5QkFBRyx1Q0FBSCxDQUFMLENBREosZUFFSSx3Q0FBSSx5QkFBRyx3RUFBSCxDQUFKLENBRkosQ0FESjtBQU1IOztBQUVELHdCQUFPO0FBQVEsTUFBQSxHQUFHLEVBQUUsS0FBS3BCLEtBQUwsQ0FBV3FCO0FBQXhCLE1BQVA7QUFDSDs7QUFqRTJEOzs7OEJBQTNDOUIsa0IsZUFDRTtBQUNmO0FBQ0E2QixFQUFBQSxTQUFTLEVBQUVFLG1CQUFVQyxJQUFWLENBQWVDLFVBRlg7QUFJZjtBQUNBUixFQUFBQSxPQUFPLEVBQUVNLG1CQUFVQyxJQUFWLENBQWVDLFVBTFQ7QUFPZjtBQUNBSCxFQUFBQSxHQUFHLEVBQUVDLG1CQUFVRyxNQVJBO0FBVWY7QUFDQXhCLEVBQUFBLFVBQVUsRUFBRXFCLG1CQUFVSSxJQUFWLENBQWVGO0FBWFosQzs4QkFERmpDLGtCLGtCQWVLO0FBQ2xCNkIsRUFBQUEsU0FBUyxFQUFFLElBRE87QUFFbEJKLEVBQUFBLE9BQU8sRUFBRTtBQUZTLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IGRpcyBmcm9tICcuLi8uLi8uLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXInO1xuaW1wb3J0IHtLZXl9IGZyb20gXCIuLi8uLi8uLi9LZXlib2FyZFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbnRlZ3JhdGlvbk1hbmFnZXIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIC8vIGZhbHNlIHRvIGRpc3BsYXkgYW4gZXJyb3Igc2F5aW5nIHRoYXQgd2UgY291bGRuJ3QgY29ubmVjdCB0byB0aGUgaW50ZWdyYXRpb24gbWFuYWdlclxuICAgICAgICBjb25uZWN0ZWQ6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXG5cbiAgICAgICAgLy8gdHJ1ZSB0byBkaXNwbGF5IGEgbG9hZGluZyBzcGlubmVyXG4gICAgICAgIGxvYWRpbmc6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXG5cbiAgICAgICAgLy8gVGhlIHNvdXJjZSBVUkwgdG8gbG9hZFxuICAgICAgICB1cmw6IFByb3BUeXBlcy5zdHJpbmcsXG5cbiAgICAgICAgLy8gY2FsbGJhY2sgd2hlbiB0aGUgbWFuYWdlciBpcyBkaXNtaXNzZWRcbiAgICAgICAgb25GaW5pc2hlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9O1xuXG4gICAgc3RhdGljIGRlZmF1bHRQcm9wcyA9IHtcbiAgICAgICAgY29ubmVjdGVkOiB0cnVlLFxuICAgICAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICB9O1xuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hlclJlZiA9IGRpcy5yZWdpc3Rlcih0aGlzLm9uQWN0aW9uKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5vbktleURvd24pO1xuICAgIH1cblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICBkaXMudW5yZWdpc3Rlcih0aGlzLmRpc3BhdGNoZXJSZWYpO1xuICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLm9uS2V5RG93bik7XG4gICAgfVxuXG4gICAgb25LZXlEb3duID0gKGV2KSA9PiB7XG4gICAgICAgIGlmIChldi5rZXkgPT09IEtleS5FU0NBUEUpIHtcbiAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG9uQWN0aW9uID0gKHBheWxvYWQpID0+IHtcbiAgICAgICAgaWYgKHBheWxvYWQuYWN0aW9uID09PSAnY2xvc2Vfc2NhbGFyJykge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5sb2FkaW5nKSB7XG4gICAgICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9JbnRlZ3JhdGlvbk1hbmFnZXJfbG9hZGluZyc+XG4gICAgICAgICAgICAgICAgICAgIDxoMz57X3QoXCJDb25uZWN0aW5nIHRvIGludGVncmF0aW9uIG1hbmFnZXIuLi5cIil9PC9oMz5cbiAgICAgICAgICAgICAgICAgICAgPFNwaW5uZXIgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMucHJvcHMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9JbnRlZ3JhdGlvbk1hbmFnZXJfZXJyb3InPlxuICAgICAgICAgICAgICAgICAgICA8aDM+e190KFwiQ2Fubm90IGNvbm5lY3QgdG8gaW50ZWdyYXRpb24gbWFuYWdlclwiKX08L2gzPlxuICAgICAgICAgICAgICAgICAgICA8cD57X3QoXCJUaGUgaW50ZWdyYXRpb24gbWFuYWdlciBpcyBvZmZsaW5lIG9yIGl0IGNhbm5vdCByZWFjaCB5b3VyIGhvbWVzZXJ2ZXIuXCIpfTwvcD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gPGlmcmFtZSBzcmM9e3RoaXMucHJvcHMudXJsfT48L2lmcmFtZT47XG4gICAgfVxufVxuIl19