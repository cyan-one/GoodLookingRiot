"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../index"));

/*
Copyright 2015, 2016 OpenMarket Ltd

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
 * A component which wraps an EditableText, with a spinner while updates take
 * place.
 *
 * Parent components should supply an 'onSubmit' callback which returns a
 * promise; a spinner is shown until the promise resolves.
 *
 * The parent can also supply a 'getInitialValue' callback, which works in a
 * similarly asynchronous way. If this is not provided, the initial value is
 * taken from the 'initialValue' property.
 */
class EditableTextContainer extends _react.default.Component {
  constructor(props) {
    super(props);
    this._unmounted = false;
    this.state = {
      busy: false,
      errorString: null,
      value: props.initialValue
    };
    this._onValueChanged = this._onValueChanged.bind(this);
  }

  componentDidMount() {
    if (this.props.getInitialValue === undefined) {
      // use whatever was given in the initialValue property.
      return;
    }

    this.setState({
      busy: true
    });
    this.props.getInitialValue().then(result => {
      if (this._unmounted) {
        return;
      }

      this.setState({
        busy: false,
        value: result
      });
    }, error => {
      if (this._unmounted) {
        return;
      }

      this.setState({
        errorString: error.toString(),
        busy: false
      });
    });
  }

  componentWillUnmount() {
    this._unmounted = true;
  }

  _onValueChanged(value, shouldSubmit) {
    if (!shouldSubmit) {
      return;
    }

    this.setState({
      busy: true,
      errorString: null
    });
    this.props.onSubmit(value).then(() => {
      if (this._unmounted) {
        return;
      }

      this.setState({
        busy: false,
        value: value
      });
    }, error => {
      if (this._unmounted) {
        return;
      }

      this.setState({
        errorString: error.toString(),
        busy: false
      });
    });
  }

  render() {
    if (this.state.busy) {
      const Loader = sdk.getComponent("elements.Spinner");
      return /*#__PURE__*/_react.default.createElement(Loader, null);
    } else if (this.state.errorString) {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "error"
      }, this.state.errorString);
    } else {
      const EditableText = sdk.getComponent('elements.EditableText');
      return /*#__PURE__*/_react.default.createElement(EditableText, {
        initialValue: this.state.value,
        placeholder: this.props.placeholder,
        onValueChanged: this._onValueChanged,
        blurToSubmit: this.props.blurToSubmit
      });
    }
  }

}

exports.default = EditableTextContainer;
EditableTextContainer.propTypes = {
  /* callback to retrieve the initial value. */
  getInitialValue: _propTypes.default.func,

  /* initial value; used if getInitialValue is not given */
  initialValue: _propTypes.default.string,

  /* placeholder text to use when the value is empty (and not being
   * edited) */
  placeholder: _propTypes.default.string,

  /* callback to update the value. Called with a single argument: the new
   * value. */
  onSubmit: _propTypes.default.func,

  /* should the input submit when focus is lost? */
  blurToSubmit: _propTypes.default.bool
};
EditableTextContainer.defaultProps = {
  initialValue: "",
  placeholder: "",
  blurToSubmit: false,
  onSubmit: function (v) {
    return Promise.resolve();
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL0VkaXRhYmxlVGV4dENvbnRhaW5lci5qcyJdLCJuYW1lcyI6WyJFZGl0YWJsZVRleHRDb250YWluZXIiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJfdW5tb3VudGVkIiwic3RhdGUiLCJidXN5IiwiZXJyb3JTdHJpbmciLCJ2YWx1ZSIsImluaXRpYWxWYWx1ZSIsIl9vblZhbHVlQ2hhbmdlZCIsImJpbmQiLCJjb21wb25lbnREaWRNb3VudCIsImdldEluaXRpYWxWYWx1ZSIsInVuZGVmaW5lZCIsInNldFN0YXRlIiwidGhlbiIsInJlc3VsdCIsImVycm9yIiwidG9TdHJpbmciLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInNob3VsZFN1Ym1pdCIsIm9uU3VibWl0IiwicmVuZGVyIiwiTG9hZGVyIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiRWRpdGFibGVUZXh0IiwicGxhY2Vob2xkZXIiLCJibHVyVG9TdWJtaXQiLCJwcm9wVHlwZXMiLCJQcm9wVHlwZXMiLCJmdW5jIiwic3RyaW5nIiwiYm9vbCIsImRlZmF1bHRQcm9wcyIsInYiLCJQcm9taXNlIiwicmVzb2x2ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBbEJBOzs7Ozs7Ozs7Ozs7Ozs7O0FBb0JBOzs7Ozs7Ozs7OztBQVdlLE1BQU1BLHFCQUFOLFNBQW9DQyxlQUFNQyxTQUExQyxDQUFvRDtBQUMvREMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBRUEsU0FBS0MsVUFBTCxHQUFrQixLQUFsQjtBQUNBLFNBQUtDLEtBQUwsR0FBYTtBQUNUQyxNQUFBQSxJQUFJLEVBQUUsS0FERztBQUVUQyxNQUFBQSxXQUFXLEVBQUUsSUFGSjtBQUdUQyxNQUFBQSxLQUFLLEVBQUVMLEtBQUssQ0FBQ007QUFISixLQUFiO0FBS0EsU0FB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WUFBWSxFQUFFc0IsbUJBQVVFLE1BTE07O0FBTzlCOztBQUVBTCxFQUFBQSxXQUFXLEVBQUVHLG1CQUFVRSxNQVRPOztBQVc5Qjs7QUFFQVgsRUFBQUEsUUFBUSxFQUFFUyxtQkFBVUMsSUFiVTs7QUFlOUI7QUFDQUgsRUFBQUEsWUFBWSxFQUFFRSxtQkFBVUc7QUFoQk0sQ0FBbEM7QUFvQkFuQyxxQkFBcUIsQ0FBQ29DLFlBQXRCLEdBQXFDO0FBQ2pDMUIsRUFBQUEsWUFBWSxFQUFFLEVBRG1CO0FBRWpDbUIsRUFBQUEsV0FBVyxFQUFFLEVBRm9CO0FBR2pDQyxFQUFBQSxZQUFZLEVBQUUsS0FIbUI7QUFJakNQLEVBQUFBLFFBQVEsRUFBRSxVQUFTYyxDQUFULEVBQVk7QUFBQyxXQUFPQyxPQUFPLENBQUNDLE9BQVIsRUFBUDtBQUEyQjtBQUpqQixDQUFyQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcblxuLyoqXG4gKiBBIGNvbXBvbmVudCB3aGljaCB3cmFwcyBhbiBFZGl0YWJsZVRleHQsIHdpdGggYSBzcGlubmVyIHdoaWxlIHVwZGF0ZXMgdGFrZVxuICogcGxhY2UuXG4gKlxuICogUGFyZW50IGNvbXBvbmVudHMgc2hvdWxkIHN1cHBseSBhbiAnb25TdWJtaXQnIGNhbGxiYWNrIHdoaWNoIHJldHVybnMgYVxuICogcHJvbWlzZTsgYSBzcGlubmVyIGlzIHNob3duIHVudGlsIHRoZSBwcm9taXNlIHJlc29sdmVzLlxuICpcbiAqIFRoZSBwYXJlbnQgY2FuIGFsc28gc3VwcGx5IGEgJ2dldEluaXRpYWxWYWx1ZScgY2FsbGJhY2ssIHdoaWNoIHdvcmtzIGluIGFcbiAqIHNpbWlsYXJseSBhc3luY2hyb25vdXMgd2F5LiBJZiB0aGlzIGlzIG5vdCBwcm92aWRlZCwgdGhlIGluaXRpYWwgdmFsdWUgaXNcbiAqIHRha2VuIGZyb20gdGhlICdpbml0aWFsVmFsdWUnIHByb3BlcnR5LlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFZGl0YWJsZVRleHRDb250YWluZXIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLl91bm1vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIGJ1c3k6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3JTdHJpbmc6IG51bGwsXG4gICAgICAgICAgICB2YWx1ZTogcHJvcHMuaW5pdGlhbFZhbHVlLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9vblZhbHVlQ2hhbmdlZCA9IHRoaXMuX29uVmFsdWVDaGFuZ2VkLmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmdldEluaXRpYWxWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyB1c2Ugd2hhdGV2ZXIgd2FzIGdpdmVuIGluIHRoZSBpbml0aWFsVmFsdWUgcHJvcGVydHkuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtidXN5OiB0cnVlfSk7XG5cbiAgICAgICAgdGhpcy5wcm9wcy5nZXRJbml0aWFsVmFsdWUoKS50aGVuKFxuICAgICAgICAgICAgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl91bm1vdW50ZWQpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGJ1c3k6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcmVzdWx0LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl91bm1vdW50ZWQpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yU3RyaW5nOiBlcnJvci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICBidXN5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIHRoaXMuX3VubW91bnRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgX29uVmFsdWVDaGFuZ2VkKHZhbHVlLCBzaG91bGRTdWJtaXQpIHtcbiAgICAgICAgaWYgKCFzaG91bGRTdWJtaXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgYnVzeTogdHJ1ZSxcbiAgICAgICAgICAgIGVycm9yU3RyaW5nOiBudWxsLFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnByb3BzLm9uU3VibWl0KHZhbHVlKS50aGVuKFxuICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl91bm1vdW50ZWQpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGJ1c3k6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3VubW91bnRlZCkgeyByZXR1cm47IH1cbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JTdHJpbmc6IGVycm9yLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgIGJ1c3k6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmJ1c3kpIHtcbiAgICAgICAgICAgIGNvbnN0IExvYWRlciA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5TcGlubmVyXCIpO1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8TG9hZGVyIC8+XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUuZXJyb3JTdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJlcnJvclwiPnsgdGhpcy5zdGF0ZS5lcnJvclN0cmluZyB9PC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgRWRpdGFibGVUZXh0ID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuRWRpdGFibGVUZXh0Jyk7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxFZGl0YWJsZVRleHQgaW5pdGlhbFZhbHVlPXt0aGlzLnN0YXRlLnZhbHVlfVxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17dGhpcy5wcm9wcy5wbGFjZWhvbGRlcn1cbiAgICAgICAgICAgICAgICAgICAgb25WYWx1ZUNoYW5nZWQ9e3RoaXMuX29uVmFsdWVDaGFuZ2VkfVxuICAgICAgICAgICAgICAgICAgICBibHVyVG9TdWJtaXQ9e3RoaXMucHJvcHMuYmx1clRvU3VibWl0fVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5FZGl0YWJsZVRleHRDb250YWluZXIucHJvcFR5cGVzID0ge1xuICAgIC8qIGNhbGxiYWNrIHRvIHJldHJpZXZlIHRoZSBpbml0aWFsIHZhbHVlLiAqL1xuICAgIGdldEluaXRpYWxWYWx1ZTogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgICAvKiBpbml0aWFsIHZhbHVlOyB1c2VkIGlmIGdldEluaXRpYWxWYWx1ZSBpcyBub3QgZ2l2ZW4gKi9cbiAgICBpbml0aWFsVmFsdWU6IFByb3BUeXBlcy5zdHJpbmcsXG5cbiAgICAvKiBwbGFjZWhvbGRlciB0ZXh0IHRvIHVzZSB3aGVuIHRoZSB2YWx1ZSBpcyBlbXB0eSAoYW5kIG5vdCBiZWluZ1xuICAgICAqIGVkaXRlZCkgKi9cbiAgICBwbGFjZWhvbGRlcjogUHJvcFR5cGVzLnN0cmluZyxcblxuICAgIC8qIGNhbGxiYWNrIHRvIHVwZGF0ZSB0aGUgdmFsdWUuIENhbGxlZCB3aXRoIGEgc2luZ2xlIGFyZ3VtZW50OiB0aGUgbmV3XG4gICAgICogdmFsdWUuICovXG4gICAgb25TdWJtaXQ6IFByb3BUeXBlcy5mdW5jLFxuXG4gICAgLyogc2hvdWxkIHRoZSBpbnB1dCBzdWJtaXQgd2hlbiBmb2N1cyBpcyBsb3N0PyAqL1xuICAgIGJsdXJUb1N1Ym1pdDogUHJvcFR5cGVzLmJvb2wsXG59O1xuXG5cbkVkaXRhYmxlVGV4dENvbnRhaW5lci5kZWZhdWx0UHJvcHMgPSB7XG4gICAgaW5pdGlhbFZhbHVlOiBcIlwiLFxuICAgIHBsYWNlaG9sZGVyOiBcIlwiLFxuICAgIGJsdXJUb1N1Ym1pdDogZmFsc2UsXG4gICAgb25TdWJtaXQ6IGZ1bmN0aW9uKHYpIHtyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7IH0sXG59O1xuIl19