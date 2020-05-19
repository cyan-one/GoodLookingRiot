"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var sdk = _interopRequireWildcard(require("./index"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("./languageHandler");

/*
Copyright 2015, 2016 OpenMarket Ltd
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

/**
 * Wrap an asynchronous loader function with a react component which shows a
 * spinner until the real component loads.
 */
var _default = (0, _createReactClass.default)({
  displayName: "AsyncWrapper",
  propTypes: {
    /** A promise which resolves with the real component
     */
    prom: _propTypes.default.object.isRequired
  },
  getInitialState: function () {
    return {
      component: null,
      error: null
    };
  },
  componentDidMount: function () {
    this._unmounted = false; // XXX: temporary logging to try to diagnose
    // https://github.com/vector-im/riot-web/issues/3148

    console.log('Starting load of AsyncWrapper for modal');
    this.props.prom.then(result => {
      if (this._unmounted) {
        return;
      } // Take the 'default' member if it's there, then we support
      // passing in just an import()ed module, since ES6 async import
      // always returns a module *namespace*.


      const component = result.default ? result.default : result;
      this.setState({
        component
      });
    }).catch(e => {
      console.warn('AsyncWrapper promise failed', e);
      this.setState({
        error: e
      });
    });
  },
  componentWillUnmount: function () {
    this._unmounted = true;
  },
  _onWrapperCancelClick: function () {
    this.props.onFinished(false);
  },
  render: function () {
    if (this.state.component) {
      const Component = this.state.component;
      return /*#__PURE__*/React.createElement(Component, this.props);
    } else if (this.state.error) {
      const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
      const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
      return /*#__PURE__*/React.createElement(BaseDialog, {
        onFinished: this.props.onFinished,
        title: (0, _languageHandler._t)("Error")
      }, (0, _languageHandler._t)("Unable to load! Check your network connectivity and try again."), /*#__PURE__*/React.createElement(DialogButtons, {
        primaryButton: (0, _languageHandler._t)("Dismiss"),
        onPrimaryButtonClick: this._onWrapperCancelClick,
        hasCancel: false
      }));
    } else {
      // show a spinner until the component is loaded.
      const Spinner = sdk.getComponent("elements.Spinner");
      return /*#__PURE__*/React.createElement(Spinner, null);
    }
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Bc3luY1dyYXBwZXIuanMiXSwibmFtZXMiOlsicHJvcFR5cGVzIiwicHJvbSIsIlByb3BUeXBlcyIsIm9iamVjdCIsImlzUmVxdWlyZWQiLCJnZXRJbml0aWFsU3RhdGUiLCJjb21wb25lbnQiLCJlcnJvciIsImNvbXBvbmVudERpZE1vdW50IiwiX3VubW91bnRlZCIsImNvbnNvbGUiLCJsb2ciLCJwcm9wcyIsInRoZW4iLCJyZXN1bHQiLCJkZWZhdWx0Iiwic2V0U3RhdGUiLCJjYXRjaCIsImUiLCJ3YXJuIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJfb25XcmFwcGVyQ2FuY2VsQ2xpY2siLCJvbkZpbmlzaGVkIiwicmVuZGVyIiwic3RhdGUiLCJDb21wb25lbnQiLCJCYXNlRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiRGlhbG9nQnV0dG9ucyIsIlNwaW5uZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQXBCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzQkE7Ozs7ZUFJZSwrQkFBaUI7QUFBQTtBQUM1QkEsRUFBQUEsU0FBUyxFQUFFO0FBQ1A7O0FBRUFDLElBQUFBLElBQUksRUFBRUMsbUJBQVVDLE1BQVYsQ0FBaUJDO0FBSGhCLEdBRGlCO0FBTzVCQyxFQUFBQSxlQUFlLEVBQUUsWUFBVztBQUN4QixXQUFPO0FBQ0hDLE1BQUFBLFNBQVMsRUFBRSxJQURSO0FBRUhDLE1BQUFBLEtBQUssRUFBRTtBQUZKLEtBQVA7QUFJSCxHQVoyQjtBQWM1QkMsRUFBQUEsaUJBQWlCLEVBQUUsWUFBVztBQUMxQixTQUFLQyxVQUFMLEdBQWtCLEtBQWxCLENBRDBCLENBRTFCO0FBQ0E7O0FBQ0FDLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLHlDQUFaO0FBQ0EsU0FBS0MsS0FBTCxDQUFXWCxJQUFYLENBQWdCWSxJQUFoQixDQUFzQkMsTUFBRCxJQUFZO0FBQzdCLFVBQUksS0FBS0wsVUFBVCxFQUFxQjtBQUNqQjtBQUNILE9BSDRCLENBSTdCO0FBQ0E7QUFDQTs7O0FBQ0EsWUFBTUgsU0FBUyxHQUFHUSxNQUFNLENBQUNDLE9BQVAsR0FBaUJELE1BQU0sQ0FBQ0MsT0FBeEIsR0FBa0NELE1BQXBEO0FBQ0EsV0FBS0UsUUFBTCxDQUFjO0FBQUNWLFFBQUFBO0FBQUQsT0FBZDtBQUNILEtBVEQsRUFTR1csS0FUSCxDQVNVQyxDQUFELElBQU87QUFDWlIsTUFBQUEsT0FBTyxDQUFDUyxJQUFSLENBQWEsNkJBQWIsRUFBNENELENBQTVDO0FBQ0EsV0FBS0YsUUFBTCxDQUFjO0FBQUNULFFBQUFBLEtBQUssRUFBRVc7QUFBUixPQUFkO0FBQ0gsS0FaRDtBQWFILEdBaEMyQjtBQWtDNUJFLEVBQUFBLG9CQUFvQixFQUFFLFlBQVc7QUFDN0IsU0FBS1gsVUFBTCxHQUFrQixJQUFsQjtBQUNILEdBcEMyQjtBQXNDNUJZLEVBQUFBLHFCQUFxQixFQUFFLFlBQVc7QUFDOUIsU0FBS1QsS0FBTCxDQUFXVSxVQUFYLENBQXNCLEtBQXRCO0FBQ0gsR0F4QzJCO0FBMEM1QkMsRUFBQUEsTUFBTSxFQUFFLFlBQVc7QUFDZixRQUFJLEtBQUtDLEtBQUwsQ0FBV2xCLFNBQWYsRUFBMEI7QUFDdEIsWUFBTW1CLFNBQVMsR0FBRyxLQUFLRCxLQUFMLENBQVdsQixTQUE3QjtBQUNBLDBCQUFPLG9CQUFDLFNBQUQsRUFBZSxLQUFLTSxLQUFwQixDQUFQO0FBQ0gsS0FIRCxNQUdPLElBQUksS0FBS1ksS0FBTCxDQUFXakIsS0FBZixFQUFzQjtBQUN6QixZQUFNbUIsVUFBVSxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsMEJBQWpCLENBQW5CO0FBQ0EsWUFBTUMsYUFBYSxHQUFHRixHQUFHLENBQUNDLFlBQUosQ0FBaUIsOEJBQWpCLENBQXRCO0FBQ0EsMEJBQU8sb0JBQUMsVUFBRDtBQUFZLFFBQUEsVUFBVSxFQUFFLEtBQUtoQixLQUFMLENBQVdVLFVBQW5DO0FBQ0gsUUFBQSxLQUFLLEVBQUUseUJBQUcsT0FBSDtBQURKLFNBR0YseUJBQUcsZ0VBQUgsQ0FIRSxlQUlILG9CQUFDLGFBQUQ7QUFBZSxRQUFBLGFBQWEsRUFBRSx5QkFBRyxTQUFILENBQTlCO0FBQ0ksUUFBQSxvQkFBb0IsRUFBRSxLQUFLRCxxQkFEL0I7QUFFSSxRQUFBLFNBQVMsRUFBRTtBQUZmLFFBSkcsQ0FBUDtBQVNILEtBWk0sTUFZQTtBQUNIO0FBQ0EsWUFBTVMsT0FBTyxHQUFHSCxHQUFHLENBQUNDLFlBQUosQ0FBaUIsa0JBQWpCLENBQWhCO0FBQ0EsMEJBQU8sb0JBQUMsT0FBRCxPQUFQO0FBQ0g7QUFDSjtBQS9EMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4vaW5kZXgnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi9sYW5ndWFnZUhhbmRsZXInO1xuXG4vKipcbiAqIFdyYXAgYW4gYXN5bmNocm9ub3VzIGxvYWRlciBmdW5jdGlvbiB3aXRoIGEgcmVhY3QgY29tcG9uZW50IHdoaWNoIHNob3dzIGFcbiAqIHNwaW5uZXIgdW50aWwgdGhlIHJlYWwgY29tcG9uZW50IGxvYWRzLlxuICovXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWFjdENsYXNzKHtcbiAgICBwcm9wVHlwZXM6IHtcbiAgICAgICAgLyoqIEEgcHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aXRoIHRoZSByZWFsIGNvbXBvbmVudFxuICAgICAgICAgKi9cbiAgICAgICAgcHJvbTogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29tcG9uZW50OiBudWxsLFxuICAgICAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fdW5tb3VudGVkID0gZmFsc2U7XG4gICAgICAgIC8vIFhYWDogdGVtcG9yYXJ5IGxvZ2dpbmcgdG8gdHJ5IHRvIGRpYWdub3NlXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC13ZWIvaXNzdWVzLzMxNDhcbiAgICAgICAgY29uc29sZS5sb2coJ1N0YXJ0aW5nIGxvYWQgb2YgQXN5bmNXcmFwcGVyIGZvciBtb2RhbCcpO1xuICAgICAgICB0aGlzLnByb3BzLnByb20udGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fdW5tb3VudGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVGFrZSB0aGUgJ2RlZmF1bHQnIG1lbWJlciBpZiBpdCdzIHRoZXJlLCB0aGVuIHdlIHN1cHBvcnRcbiAgICAgICAgICAgIC8vIHBhc3NpbmcgaW4ganVzdCBhbiBpbXBvcnQoKWVkIG1vZHVsZSwgc2luY2UgRVM2IGFzeW5jIGltcG9ydFxuICAgICAgICAgICAgLy8gYWx3YXlzIHJldHVybnMgYSBtb2R1bGUgKm5hbWVzcGFjZSouXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSByZXN1bHQuZGVmYXVsdCA/IHJlc3VsdC5kZWZhdWx0IDogcmVzdWx0O1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Y29tcG9uZW50fSk7XG4gICAgICAgIH0pLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0FzeW5jV3JhcHBlciBwcm9taXNlIGZhaWxlZCcsIGUpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7ZXJyb3I6IGV9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fdW5tb3VudGVkID0gdHJ1ZTtcbiAgICB9LFxuXG4gICAgX29uV3JhcHBlckNhbmNlbENsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKGZhbHNlKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuY29tcG9uZW50KSB7XG4gICAgICAgICAgICBjb25zdCBDb21wb25lbnQgPSB0aGlzLnN0YXRlLmNvbXBvbmVudDtcbiAgICAgICAgICAgIHJldHVybiA8Q29tcG9uZW50IHsuLi50aGlzLnByb3BzfSAvPjtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLmVycm9yKSB7XG4gICAgICAgICAgICBjb25zdCBCYXNlRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZGlhbG9ncy5CYXNlRGlhbG9nJyk7XG4gICAgICAgICAgICBjb25zdCBEaWFsb2dCdXR0b25zID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuRGlhbG9nQnV0dG9ucycpO1xuICAgICAgICAgICAgcmV0dXJuIDxCYXNlRGlhbG9nIG9uRmluaXNoZWQ9e3RoaXMucHJvcHMub25GaW5pc2hlZH1cbiAgICAgICAgICAgICAgICB0aXRsZT17X3QoXCJFcnJvclwiKX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7X3QoXCJVbmFibGUgdG8gbG9hZCEgQ2hlY2sgeW91ciBuZXR3b3JrIGNvbm5lY3Rpdml0eSBhbmQgdHJ5IGFnYWluLlwiKX1cbiAgICAgICAgICAgICAgICA8RGlhbG9nQnV0dG9ucyBwcmltYXJ5QnV0dG9uPXtfdChcIkRpc21pc3NcIil9XG4gICAgICAgICAgICAgICAgICAgIG9uUHJpbWFyeUJ1dHRvbkNsaWNrPXt0aGlzLl9vbldyYXBwZXJDYW5jZWxDbGlja31cbiAgICAgICAgICAgICAgICAgICAgaGFzQ2FuY2VsPXtmYWxzZX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9CYXNlRGlhbG9nPjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHNob3cgYSBzcGlubmVyIHVudGlsIHRoZSBjb21wb25lbnQgaXMgbG9hZGVkLlxuICAgICAgICAgICAgY29uc3QgU3Bpbm5lciA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5TcGlubmVyXCIpO1xuICAgICAgICAgICAgcmV0dXJuIDxTcGlubmVyIC8+O1xuICAgICAgICB9XG4gICAgfSxcbn0pO1xuXG4iXX0=