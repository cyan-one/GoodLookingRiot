"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _Keyboard = require("../../../Keyboard");

/*
Copyright 2015, 2016 OpenMarket Ltd
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
  displayName: 'EditableText',
  propTypes: {
    onValueChanged: _propTypes.default.func,
    initialValue: _propTypes.default.string,
    label: _propTypes.default.string,
    placeholder: _propTypes.default.string,
    className: _propTypes.default.string,
    labelClassName: _propTypes.default.string,
    placeholderClassName: _propTypes.default.string,
    // Overrides blurToSubmit if true
    blurToCancel: _propTypes.default.bool,
    // Will cause onValueChanged(value, true) to fire on blur
    blurToSubmit: _propTypes.default.bool,
    editable: _propTypes.default.bool
  },
  Phases: {
    Display: "display",
    Edit: "edit"
  },
  getDefaultProps: function () {
    return {
      onValueChanged: function () {},
      initialValue: '',
      label: '',
      placeholder: '',
      editable: true,
      className: "mx_EditableText",
      placeholderClassName: "mx_EditableText_placeholder",
      blurToSubmit: false
    };
  },
  getInitialState: function () {
    return {
      phase: this.Phases.Display
    };
  },
  // TODO: [REACT-WARNING] Replace with appropriate lifecycle event
  UNSAFE_componentWillReceiveProps: function (nextProps) {
    if (nextProps.initialValue !== this.props.initialValue) {
      this.value = nextProps.initialValue;

      if (this._editable_div.current) {
        this.showPlaceholder(!this.value);
      }
    }
  },
  // TODO: [REACT-WARNING] Replace component with real class, use constructor for refs
  UNSAFE_componentWillMount: function () {
    // we track value as an JS object field rather than in React state
    // as React doesn't play nice with contentEditable.
    this.value = '';
    this.placeholder = false;
    this._editable_div = (0, _react.createRef)();
  },
  componentDidMount: function () {
    this.value = this.props.initialValue;

    if (this._editable_div.current) {
      this.showPlaceholder(!this.value);
    }
  },
  showPlaceholder: function (show) {
    if (show) {
      this._editable_div.current.textContent = this.props.placeholder;

      this._editable_div.current.setAttribute("class", this.props.className + " " + this.props.placeholderClassName);

      this.placeholder = true;
      this.value = '';
    } else {
      this._editable_div.current.textContent = this.value;

      this._editable_div.current.setAttribute("class", this.props.className);

      this.placeholder = false;
    }
  },
  getValue: function () {
    return this.value;
  },
  setValue: function (value) {
    this.value = value;
    this.showPlaceholder(!this.value);
  },
  edit: function () {
    this.setState({
      phase: this.Phases.Edit
    });
  },
  cancelEdit: function () {
    this.setState({
      phase: this.Phases.Display
    });
    this.value = this.props.initialValue;
    this.showPlaceholder(!this.value);
    this.onValueChanged(false);

    this._editable_div.current.blur();
  },
  onValueChanged: function (shouldSubmit) {
    this.props.onValueChanged(this.value, shouldSubmit);
  },
  onKeyDown: function (ev) {
    // console.log("keyDown: textContent=" + ev.target.textContent + ", value=" + this.value + ", placeholder=" + this.placeholder);
    if (this.placeholder) {
      this.showPlaceholder(false);
    }

    if (ev.key === _Keyboard.Key.ENTER) {
      ev.stopPropagation();
      ev.preventDefault();
    } // console.log("keyDown: textContent=" + ev.target.textContent + ", value=" + this.value + ", placeholder=" + this.placeholder);

  },
  onKeyUp: function (ev) {
    // console.log("keyUp: textContent=" + ev.target.textContent + ", value=" + this.value + ", placeholder=" + this.placeholder);
    if (!ev.target.textContent) {
      this.showPlaceholder(true);
    } else if (!this.placeholder) {
      this.value = ev.target.textContent;
    }

    if (ev.key === _Keyboard.Key.ENTER) {
      this.onFinish(ev);
    } else if (ev.key === _Keyboard.Key.ESCAPE) {
      this.cancelEdit();
    } // console.log("keyUp: textContent=" + ev.target.textContent + ", value=" + this.value + ", placeholder=" + this.placeholder);

  },
  onClickDiv: function (ev) {
    if (!this.props.editable) return;
    this.setState({
      phase: this.Phases.Edit
    });
  },
  onFocus: function (ev) {
    //ev.target.setSelectionRange(0, ev.target.textContent.length);
    const node = ev.target.childNodes[0];

    if (node) {
      const range = document.createRange();
      range.setStart(node, 0);
      range.setEnd(node, node.length);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  },
  onFinish: function (ev, shouldSubmit) {
    const self = this;
    const submit = ev.key === _Keyboard.Key.ENTER || shouldSubmit;
    this.setState({
      phase: this.Phases.Display
    }, () => {
      if (this.value !== this.props.initialValue) {
        self.onValueChanged(submit);
      }
    });
  },
  onBlur: function (ev) {
    const sel = window.getSelection();
    sel.removeAllRanges();

    if (this.props.blurToCancel) {
      this.cancelEdit();
    } else {
      this.onFinish(ev, this.props.blurToSubmit);
    }

    this.showPlaceholder(!this.value);
  },
  render: function () {
    const {
      className,
      editable,
      initialValue,
      label,
      labelClassName
    } = this.props;
    let editableEl;

    if (!editable || this.state.phase === this.Phases.Display && (label || labelClassName) && !this.value) {
      // show the label
      editableEl = /*#__PURE__*/_react.default.createElement("div", {
        className: className + " " + labelClassName,
        onClick: this.onClickDiv
      }, label || initialValue);
    } else {
      // show the content editable div, but manually manage its contents as react and contentEditable don't play nice together
      editableEl = /*#__PURE__*/_react.default.createElement("div", {
        ref: this._editable_div,
        contentEditable: true,
        className: className,
        onKeyDown: this.onKeyDown,
        onKeyUp: this.onKeyUp,
        onFocus: this.onFocus,
        onBlur: this.onBlur
      });
    }

    return editableEl;
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL0VkaXRhYmxlVGV4dC5qcyJdLCJuYW1lcyI6WyJkaXNwbGF5TmFtZSIsInByb3BUeXBlcyIsIm9uVmFsdWVDaGFuZ2VkIiwiUHJvcFR5cGVzIiwiZnVuYyIsImluaXRpYWxWYWx1ZSIsInN0cmluZyIsImxhYmVsIiwicGxhY2Vob2xkZXIiLCJjbGFzc05hbWUiLCJsYWJlbENsYXNzTmFtZSIsInBsYWNlaG9sZGVyQ2xhc3NOYW1lIiwiYmx1clRvQ2FuY2VsIiwiYm9vbCIsImJsdXJUb1N1Ym1pdCIsImVkaXRhYmxlIiwiUGhhc2VzIiwiRGlzcGxheSIsIkVkaXQiLCJnZXREZWZhdWx0UHJvcHMiLCJnZXRJbml0aWFsU3RhdGUiLCJwaGFzZSIsIlVOU0FGRV9jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzIiwibmV4dFByb3BzIiwicHJvcHMiLCJ2YWx1ZSIsIl9lZGl0YWJsZV9kaXYiLCJjdXJyZW50Iiwic2hvd1BsYWNlaG9sZGVyIiwiVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudCIsImNvbXBvbmVudERpZE1vdW50Iiwic2hvdyIsInRleHRDb250ZW50Iiwic2V0QXR0cmlidXRlIiwiZ2V0VmFsdWUiLCJzZXRWYWx1ZSIsImVkaXQiLCJzZXRTdGF0ZSIsImNhbmNlbEVkaXQiLCJibHVyIiwic2hvdWxkU3VibWl0Iiwib25LZXlEb3duIiwiZXYiLCJrZXkiLCJLZXkiLCJFTlRFUiIsInN0b3BQcm9wYWdhdGlvbiIsInByZXZlbnREZWZhdWx0Iiwib25LZXlVcCIsInRhcmdldCIsIm9uRmluaXNoIiwiRVNDQVBFIiwib25DbGlja0RpdiIsIm9uRm9jdXMiLCJub2RlIiwiY2hpbGROb2RlcyIsInJhbmdlIiwiZG9jdW1lbnQiLCJjcmVhdGVSYW5nZSIsInNldFN0YXJ0Iiwic2V0RW5kIiwibGVuZ3RoIiwic2VsIiwid2luZG93IiwiZ2V0U2VsZWN0aW9uIiwicmVtb3ZlQWxsUmFuZ2VzIiwiYWRkUmFuZ2UiLCJzZWxmIiwic3VibWl0Iiwib25CbHVyIiwicmVuZGVyIiwiZWRpdGFibGVFbCIsInN0YXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFwQkE7Ozs7Ozs7Ozs7Ozs7Ozs7ZUFzQmUsK0JBQWlCO0FBQzVCQSxFQUFBQSxXQUFXLEVBQUUsY0FEZTtBQUc1QkMsRUFBQUEsU0FBUyxFQUFFO0FBQ1BDLElBQUFBLGNBQWMsRUFBRUMsbUJBQVVDLElBRG5CO0FBRVBDLElBQUFBLFlBQVksRUFBRUYsbUJBQVVHLE1BRmpCO0FBR1BDLElBQUFBLEtBQUssRUFBRUosbUJBQVVHLE1BSFY7QUFJUEUsSUFBQUEsV0FBVyxFQUFFTCxtQkFBVUcsTUFKaEI7QUFLUEcsSUFBQUEsU0FBUyxFQUFFTixtQkFBVUcsTUFMZDtBQU1QSSxJQUFBQSxjQUFjLEVBQUVQLG1CQUFVRyxNQU5uQjtBQU9QSyxJQUFBQSxvQkFBb0IsRUFBRVIsbUJBQVVHLE1BUHpCO0FBUVA7QUFDQU0sSUFBQUEsWUFBWSxFQUFFVCxtQkFBVVUsSUFUakI7QUFVUDtBQUNBQyxJQUFBQSxZQUFZLEVBQUVYLG1CQUFVVSxJQVhqQjtBQVlQRSxJQUFBQSxRQUFRLEVBQUVaLG1CQUFVVTtBQVpiLEdBSGlCO0FBa0I1QkcsRUFBQUEsTUFBTSxFQUFFO0FBQ0pDLElBQUFBLE9BQU8sRUFBRSxTQURMO0FBRUpDLElBQUFBLElBQUksRUFBRTtBQUZGLEdBbEJvQjtBQXVCNUJDLEVBQUFBLGVBQWUsRUFBRSxZQUFXO0FBQ3hCLFdBQU87QUFDSGpCLE1BQUFBLGNBQWMsRUFBRSxZQUFXLENBQUUsQ0FEMUI7QUFFSEcsTUFBQUEsWUFBWSxFQUFFLEVBRlg7QUFHSEUsTUFBQUEsS0FBSyxFQUFFLEVBSEo7QUFJSEMsTUFBQUEsV0FBVyxFQUFFLEVBSlY7QUFLSE8sTUFBQUEsUUFBUSxFQUFFLElBTFA7QUFNSE4sTUFBQUEsU0FBUyxFQUFFLGlCQU5SO0FBT0hFLE1BQUFBLG9CQUFvQixFQUFFLDZCQVBuQjtBQVFIRyxNQUFBQSxZQUFZLEVBQUU7QUFSWCxLQUFQO0FBVUgsR0FsQzJCO0FBb0M1Qk0sRUFBQUEsZUFBZSxFQUFFLFlBQVc7QUFDeEIsV0FBTztBQUNIQyxNQUFBQSxLQUFLLEVBQUUsS0FBS0wsTUFBTCxDQUFZQztBQURoQixLQUFQO0FBR0gsR0F4QzJCO0FBMEM1QjtBQUNBSyxFQUFBQSxnQ0FBZ0MsRUFBRSxVQUFTQyxTQUFULEVBQW9CO0FBQ2xELFFBQUlBLFNBQVMsQ0FBQ2xCLFlBQVYsS0FBMkIsS0FBS21CLEtBQUwsQ0FBV25CLFlBQTFDLEVBQXdEO0FBQ3BELFdBQUtvQixLQUFMLEdBQWFGLFNBQVMsQ0FBQ2xCLFlBQXZCOztBQUNBLFVBQUksS0FBS3FCLGFBQUwsQ0FBbUJDLE9BQXZCLEVBQWdDO0FBQzVCLGFBQUtDLGVBQUwsQ0FBcUIsQ0FBQyxLQUFLSCxLQUEzQjtBQUNIO0FBQ0o7QUFDSixHQWxEMkI7QUFvRDVCO0FBQ0FJLEVBQUFBLHlCQUF5QixFQUFFLFlBQVc7QUFDbEM7QUFDQTtBQUNBLFNBQUtKLEtBQUwsR0FBYSxFQUFiO0FBQ0EsU0FBS2pCLFdBQUwsR0FBbUIsS0FBbkI7QUFFQSxTQUFLa0IsYUFBTCxHQUFxQix1QkFBckI7QUFDSCxHQTVEMkI7QUE4RDVCSSxFQUFBQSxpQkFBaUIsRUFBRSxZQUFXO0FBQzFCLFNBQUtMLEtBQUwsR0FBYSxLQUFLRCxLQUFMLENBQVduQixZQUF4Qjs7QUFDQSxRQUFJLEtBQUtxQixhQUFMLENBQW1CQyxPQUF2QixFQUFnQztBQUM1QixXQUFLQyxlQUFMLENBQXFCLENBQUMsS0FBS0gsS0FBM0I7QUFDSDtBQUNKLEdBbkUyQjtBQXFFNUJHLEVBQUFBLGVBQWUsRUFBRSxVQUFTRyxJQUFULEVBQWU7QUFDNUIsUUFBSUEsSUFBSixFQUFVO0FBQ04sV0FBS0wsYUFBTCxDQUFtQkMsT0FBbkIsQ0FBMkJLLFdBQTNCLEdBQXlDLEtBQUtSLEtBQUwsQ0FBV2hCLFdBQXBEOztBQUNBLFdBQUtrQixhQUFMLENBQW1CQyxPQUFuQixDQUEyQk0sWUFBM0IsQ0FBd0MsT0FBeEMsRUFBaUQsS0FBS1QsS0FBTCxDQUFXZixTQUFYLEdBQzNDLEdBRDJDLEdBQ3JDLEtBQUtlLEtBQUwsQ0FBV2Isb0JBRHZCOztBQUVBLFdBQUtILFdBQUwsR0FBbUIsSUFBbkI7QUFDQSxXQUFLaUIsS0FBTCxHQUFhLEVBQWI7QUFDSCxLQU5ELE1BTU87QUFDSCxXQUFLQyxhQUFMLENBQW1CQyxPQUFuQixDQUEyQkssV0FBM0IsR0FBeUMsS0FBS1AsS0FBOUM7O0FBQ0EsV0FBS0MsYUFBTCxDQUFtQkMsT0FBbkIsQ0FBMkJNLFlBQTNCLENBQXdDLE9BQXhDLEVBQWlELEtBQUtULEtBQUwsQ0FBV2YsU0FBNUQ7O0FBQ0EsV0FBS0QsV0FBTCxHQUFtQixLQUFuQjtBQUNIO0FBQ0osR0FqRjJCO0FBbUY1QjBCLEVBQUFBLFFBQVEsRUFBRSxZQUFXO0FBQ2pCLFdBQU8sS0FBS1QsS0FBWjtBQUNILEdBckYyQjtBQXVGNUJVLEVBQUFBLFFBQVEsRUFBRSxVQUFTVixLQUFULEVBQWdCO0FBQ3RCLFNBQUtBLEtBQUwsR0FBYUEsS0FBYjtBQUNBLFNBQUtHLGVBQUwsQ0FBcUIsQ0FBQyxLQUFLSCxLQUEzQjtBQUNILEdBMUYyQjtBQTRGNUJXLEVBQUFBLElBQUksRUFBRSxZQUFXO0FBQ2IsU0FBS0MsUUFBTCxDQUFjO0FBQ1ZoQixNQUFBQSxLQUFLLEVBQUUsS0FBS0wsTUFBTCxDQUFZRTtBQURULEtBQWQ7QUFHSCxHQWhHMkI7QUFrRzVCb0IsRUFBQUEsVUFBVSxFQUFFLFlBQVc7QUFDbkIsU0FBS0QsUUFBTCxDQUFjO0FBQ1ZoQixNQUFBQSxLQUFLLEVBQUUsS0FBS0wsTUFBTCxDQUFZQztBQURULEtBQWQ7QUFHQSxTQUFLUSxLQUFMLEdBQWEsS0FBS0QsS0FBTCxDQUFXbkIsWUFBeEI7QUFDQSxTQUFLdUIsZUFBTCxDQUFxQixDQUFDLEtBQUtILEtBQTNCO0FBQ0EsU0FBS3ZCLGNBQUwsQ0FBb0IsS0FBcEI7O0FBQ0EsU0FBS3dCLGFBQUwsQ0FBbUJDLE9BQW5CLENBQTJCWSxJQUEzQjtBQUNILEdBMUcyQjtBQTRHNUJyQyxFQUFBQSxjQUFjLEVBQUUsVUFBU3NDLFlBQVQsRUFBdUI7QUFDbkMsU0FBS2hCLEtBQUwsQ0FBV3RCLGNBQVgsQ0FBMEIsS0FBS3VCLEtBQS9CLEVBQXNDZSxZQUF0QztBQUNILEdBOUcyQjtBQWdINUJDLEVBQUFBLFNBQVMsRUFBRSxVQUFTQyxFQUFULEVBQWE7QUFDcEI7QUFFQSxRQUFJLEtBQUtsQyxXQUFULEVBQXNCO0FBQ2xCLFdBQUtvQixlQUFMLENBQXFCLEtBQXJCO0FBQ0g7O0FBRUQsUUFBSWMsRUFBRSxDQUFDQyxHQUFILEtBQVdDLGNBQUlDLEtBQW5CLEVBQTBCO0FBQ3RCSCxNQUFBQSxFQUFFLENBQUNJLGVBQUg7QUFDQUosTUFBQUEsRUFBRSxDQUFDSyxjQUFIO0FBQ0gsS0FWbUIsQ0FZcEI7O0FBQ0gsR0E3SDJCO0FBK0g1QkMsRUFBQUEsT0FBTyxFQUFFLFVBQVNOLEVBQVQsRUFBYTtBQUNsQjtBQUVBLFFBQUksQ0FBQ0EsRUFBRSxDQUFDTyxNQUFILENBQVVqQixXQUFmLEVBQTRCO0FBQ3hCLFdBQUtKLGVBQUwsQ0FBcUIsSUFBckI7QUFDSCxLQUZELE1BRU8sSUFBSSxDQUFDLEtBQUtwQixXQUFWLEVBQXVCO0FBQzFCLFdBQUtpQixLQUFMLEdBQWFpQixFQUFFLENBQUNPLE1BQUgsQ0FBVWpCLFdBQXZCO0FBQ0g7O0FBRUQsUUFBSVUsRUFBRSxDQUFDQyxHQUFILEtBQVdDLGNBQUlDLEtBQW5CLEVBQTBCO0FBQ3RCLFdBQUtLLFFBQUwsQ0FBY1IsRUFBZDtBQUNILEtBRkQsTUFFTyxJQUFJQSxFQUFFLENBQUNDLEdBQUgsS0FBV0MsY0FBSU8sTUFBbkIsRUFBMkI7QUFDOUIsV0FBS2IsVUFBTDtBQUNILEtBYmlCLENBZWxCOztBQUNILEdBL0kyQjtBQWlKNUJjLEVBQUFBLFVBQVUsRUFBRSxVQUFTVixFQUFULEVBQWE7QUFDckIsUUFBSSxDQUFDLEtBQUtsQixLQUFMLENBQVdULFFBQWhCLEVBQTBCO0FBRTFCLFNBQUtzQixRQUFMLENBQWM7QUFDVmhCLE1BQUFBLEtBQUssRUFBRSxLQUFLTCxNQUFMLENBQVlFO0FBRFQsS0FBZDtBQUdILEdBdkoyQjtBQXlKNUJtQyxFQUFBQSxPQUFPLEVBQUUsVUFBU1gsRUFBVCxFQUFhO0FBQ2xCO0FBRUEsVUFBTVksSUFBSSxHQUFHWixFQUFFLENBQUNPLE1BQUgsQ0FBVU0sVUFBVixDQUFxQixDQUFyQixDQUFiOztBQUNBLFFBQUlELElBQUosRUFBVTtBQUNOLFlBQU1FLEtBQUssR0FBR0MsUUFBUSxDQUFDQyxXQUFULEVBQWQ7QUFDQUYsTUFBQUEsS0FBSyxDQUFDRyxRQUFOLENBQWVMLElBQWYsRUFBcUIsQ0FBckI7QUFDQUUsTUFBQUEsS0FBSyxDQUFDSSxNQUFOLENBQWFOLElBQWIsRUFBbUJBLElBQUksQ0FBQ08sTUFBeEI7QUFFQSxZQUFNQyxHQUFHLEdBQUdDLE1BQU0sQ0FBQ0MsWUFBUCxFQUFaO0FBQ0FGLE1BQUFBLEdBQUcsQ0FBQ0csZUFBSjtBQUNBSCxNQUFBQSxHQUFHLENBQUNJLFFBQUosQ0FBYVYsS0FBYjtBQUNIO0FBQ0osR0F0SzJCO0FBd0s1Qk4sRUFBQUEsUUFBUSxFQUFFLFVBQVNSLEVBQVQsRUFBYUYsWUFBYixFQUEyQjtBQUNqQyxVQUFNMkIsSUFBSSxHQUFHLElBQWI7QUFDQSxVQUFNQyxNQUFNLEdBQUkxQixFQUFFLENBQUNDLEdBQUgsS0FBV0MsY0FBSUMsS0FBaEIsSUFBMEJMLFlBQXpDO0FBQ0EsU0FBS0gsUUFBTCxDQUFjO0FBQ1ZoQixNQUFBQSxLQUFLLEVBQUUsS0FBS0wsTUFBTCxDQUFZQztBQURULEtBQWQsRUFFRyxNQUFNO0FBQ0wsVUFBSSxLQUFLUSxLQUFMLEtBQWUsS0FBS0QsS0FBTCxDQUFXbkIsWUFBOUIsRUFBNEM7QUFDeEM4RCxRQUFBQSxJQUFJLENBQUNqRSxjQUFMLENBQW9Ca0UsTUFBcEI7QUFDSDtBQUNKLEtBTkQ7QUFPSCxHQWxMMkI7QUFvTDVCQyxFQUFBQSxNQUFNLEVBQUUsVUFBUzNCLEVBQVQsRUFBYTtBQUNqQixVQUFNb0IsR0FBRyxHQUFHQyxNQUFNLENBQUNDLFlBQVAsRUFBWjtBQUNBRixJQUFBQSxHQUFHLENBQUNHLGVBQUo7O0FBRUEsUUFBSSxLQUFLekMsS0FBTCxDQUFXWixZQUFmLEVBQTZCO0FBQ3pCLFdBQUswQixVQUFMO0FBQ0gsS0FGRCxNQUVPO0FBQ0gsV0FBS1ksUUFBTCxDQUFjUixFQUFkLEVBQWtCLEtBQUtsQixLQUFMLENBQVdWLFlBQTdCO0FBQ0g7O0FBRUQsU0FBS2MsZUFBTCxDQUFxQixDQUFDLEtBQUtILEtBQTNCO0FBQ0gsR0EvTDJCO0FBaU01QjZDLEVBQUFBLE1BQU0sRUFBRSxZQUFXO0FBQ2YsVUFBTTtBQUFDN0QsTUFBQUEsU0FBRDtBQUFZTSxNQUFBQSxRQUFaO0FBQXNCVixNQUFBQSxZQUF0QjtBQUFvQ0UsTUFBQUEsS0FBcEM7QUFBMkNHLE1BQUFBO0FBQTNDLFFBQTZELEtBQUtjLEtBQXhFO0FBQ0EsUUFBSStDLFVBQUo7O0FBRUEsUUFBSSxDQUFDeEQsUUFBRCxJQUFjLEtBQUt5RCxLQUFMLENBQVduRCxLQUFYLEtBQXFCLEtBQUtMLE1BQUwsQ0FBWUMsT0FBakMsS0FBNkNWLEtBQUssSUFBSUcsY0FBdEQsS0FBeUUsQ0FBQyxLQUFLZSxLQUFqRyxFQUF5RztBQUNyRztBQUNBOEMsTUFBQUEsVUFBVSxnQkFBRztBQUFLLFFBQUEsU0FBUyxFQUFFOUQsU0FBUyxHQUFHLEdBQVosR0FBa0JDLGNBQWxDO0FBQWtELFFBQUEsT0FBTyxFQUFFLEtBQUswQztBQUFoRSxTQUNQN0MsS0FBSyxJQUFJRixZQURGLENBQWI7QUFHSCxLQUxELE1BS087QUFDSDtBQUNBa0UsTUFBQUEsVUFBVSxnQkFBRztBQUFLLFFBQUEsR0FBRyxFQUFFLEtBQUs3QyxhQUFmO0FBQ0ssUUFBQSxlQUFlLEVBQUUsSUFEdEI7QUFFSyxRQUFBLFNBQVMsRUFBRWpCLFNBRmhCO0FBR0ssUUFBQSxTQUFTLEVBQUUsS0FBS2dDLFNBSHJCO0FBSUssUUFBQSxPQUFPLEVBQUUsS0FBS08sT0FKbkI7QUFLSyxRQUFBLE9BQU8sRUFBRSxLQUFLSyxPQUxuQjtBQU1LLFFBQUEsTUFBTSxFQUFFLEtBQUtnQjtBQU5sQixRQUFiO0FBT0g7O0FBRUQsV0FBT0UsVUFBUDtBQUNIO0FBdE4yQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCwge2NyZWF0ZVJlZn0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQge0tleX0gZnJvbSBcIi4uLy4uLy4uL0tleWJvYXJkXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnRWRpdGFibGVUZXh0JyxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBvblZhbHVlQ2hhbmdlZDogUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgbGFiZWw6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIHBsYWNlaG9sZGVyOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICBjbGFzc05hbWU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIGxhYmVsQ2xhc3NOYW1lOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICBwbGFjZWhvbGRlckNsYXNzTmFtZTogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgLy8gT3ZlcnJpZGVzIGJsdXJUb1N1Ym1pdCBpZiB0cnVlXG4gICAgICAgIGJsdXJUb0NhbmNlbDogUHJvcFR5cGVzLmJvb2wsXG4gICAgICAgIC8vIFdpbGwgY2F1c2Ugb25WYWx1ZUNoYW5nZWQodmFsdWUsIHRydWUpIHRvIGZpcmUgb24gYmx1clxuICAgICAgICBibHVyVG9TdWJtaXQ6IFByb3BUeXBlcy5ib29sLFxuICAgICAgICBlZGl0YWJsZTogUHJvcFR5cGVzLmJvb2wsXG4gICAgfSxcblxuICAgIFBoYXNlczoge1xuICAgICAgICBEaXNwbGF5OiBcImRpc3BsYXlcIixcbiAgICAgICAgRWRpdDogXCJlZGl0XCIsXG4gICAgfSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvblZhbHVlQ2hhbmdlZDogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgICAgIGluaXRpYWxWYWx1ZTogJycsXG4gICAgICAgICAgICBsYWJlbDogJycsXG4gICAgICAgICAgICBwbGFjZWhvbGRlcjogJycsXG4gICAgICAgICAgICBlZGl0YWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogXCJteF9FZGl0YWJsZVRleHRcIixcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyQ2xhc3NOYW1lOiBcIm14X0VkaXRhYmxlVGV4dF9wbGFjZWhvbGRlclwiLFxuICAgICAgICAgICAgYmx1clRvU3VibWl0OiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBoYXNlOiB0aGlzLlBoYXNlcy5EaXNwbGF5LFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvLyBUT0RPOiBbUkVBQ1QtV0FSTklOR10gUmVwbGFjZSB3aXRoIGFwcHJvcHJpYXRlIGxpZmVjeWNsZSBldmVudFxuICAgIFVOU0FGRV9jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbihuZXh0UHJvcHMpIHtcbiAgICAgICAgaWYgKG5leHRQcm9wcy5pbml0aWFsVmFsdWUgIT09IHRoaXMucHJvcHMuaW5pdGlhbFZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gbmV4dFByb3BzLmluaXRpYWxWYWx1ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9lZGl0YWJsZV9kaXYuY3VycmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd1BsYWNlaG9sZGVyKCF0aGlzLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBUT0RPOiBbUkVBQ1QtV0FSTklOR10gUmVwbGFjZSBjb21wb25lbnQgd2l0aCByZWFsIGNsYXNzLCB1c2UgY29uc3RydWN0b3IgZm9yIHJlZnNcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gd2UgdHJhY2sgdmFsdWUgYXMgYW4gSlMgb2JqZWN0IGZpZWxkIHJhdGhlciB0aGFuIGluIFJlYWN0IHN0YXRlXG4gICAgICAgIC8vIGFzIFJlYWN0IGRvZXNuJ3QgcGxheSBuaWNlIHdpdGggY29udGVudEVkaXRhYmxlLlxuICAgICAgICB0aGlzLnZhbHVlID0gJyc7XG4gICAgICAgIHRoaXMucGxhY2Vob2xkZXIgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLl9lZGl0YWJsZV9kaXYgPSBjcmVhdGVSZWYoKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5wcm9wcy5pbml0aWFsVmFsdWU7XG4gICAgICAgIGlmICh0aGlzLl9lZGl0YWJsZV9kaXYuY3VycmVudCkge1xuICAgICAgICAgICAgdGhpcy5zaG93UGxhY2Vob2xkZXIoIXRoaXMudmFsdWUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNob3dQbGFjZWhvbGRlcjogZnVuY3Rpb24oc2hvdykge1xuICAgICAgICBpZiAoc2hvdykge1xuICAgICAgICAgICAgdGhpcy5fZWRpdGFibGVfZGl2LmN1cnJlbnQudGV4dENvbnRlbnQgPSB0aGlzLnByb3BzLnBsYWNlaG9sZGVyO1xuICAgICAgICAgICAgdGhpcy5fZWRpdGFibGVfZGl2LmN1cnJlbnQuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgdGhpcy5wcm9wcy5jbGFzc05hbWVcbiAgICAgICAgICAgICAgICArIFwiIFwiICsgdGhpcy5wcm9wcy5wbGFjZWhvbGRlckNsYXNzTmFtZSk7XG4gICAgICAgICAgICB0aGlzLnBsYWNlaG9sZGVyID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRhYmxlX2Rpdi5jdXJyZW50LnRleHRDb250ZW50ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRhYmxlX2Rpdi5jdXJyZW50LnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIHRoaXMucHJvcHMuY2xhc3NOYW1lKTtcbiAgICAgICAgICAgIHRoaXMucGxhY2Vob2xkZXIgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXRWYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH0sXG5cbiAgICBzZXRWYWx1ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLnNob3dQbGFjZWhvbGRlcighdGhpcy52YWx1ZSk7XG4gICAgfSxcblxuICAgIGVkaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHBoYXNlOiB0aGlzLlBoYXNlcy5FZGl0LFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgY2FuY2VsRWRpdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGhhc2U6IHRoaXMuUGhhc2VzLkRpc3BsYXksXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5wcm9wcy5pbml0aWFsVmFsdWU7XG4gICAgICAgIHRoaXMuc2hvd1BsYWNlaG9sZGVyKCF0aGlzLnZhbHVlKTtcbiAgICAgICAgdGhpcy5vblZhbHVlQ2hhbmdlZChmYWxzZSk7XG4gICAgICAgIHRoaXMuX2VkaXRhYmxlX2Rpdi5jdXJyZW50LmJsdXIoKTtcbiAgICB9LFxuXG4gICAgb25WYWx1ZUNoYW5nZWQ6IGZ1bmN0aW9uKHNob3VsZFN1Ym1pdCkge1xuICAgICAgICB0aGlzLnByb3BzLm9uVmFsdWVDaGFuZ2VkKHRoaXMudmFsdWUsIHNob3VsZFN1Ym1pdCk7XG4gICAgfSxcblxuICAgIG9uS2V5RG93bjogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJrZXlEb3duOiB0ZXh0Q29udGVudD1cIiArIGV2LnRhcmdldC50ZXh0Q29udGVudCArIFwiLCB2YWx1ZT1cIiArIHRoaXMudmFsdWUgKyBcIiwgcGxhY2Vob2xkZXI9XCIgKyB0aGlzLnBsYWNlaG9sZGVyKTtcblxuICAgICAgICBpZiAodGhpcy5wbGFjZWhvbGRlcikge1xuICAgICAgICAgICAgdGhpcy5zaG93UGxhY2Vob2xkZXIoZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV2LmtleSA9PT0gS2V5LkVOVEVSKSB7XG4gICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImtleURvd246IHRleHRDb250ZW50PVwiICsgZXYudGFyZ2V0LnRleHRDb250ZW50ICsgXCIsIHZhbHVlPVwiICsgdGhpcy52YWx1ZSArIFwiLCBwbGFjZWhvbGRlcj1cIiArIHRoaXMucGxhY2Vob2xkZXIpO1xuICAgIH0sXG5cbiAgICBvbktleVVwOiBmdW5jdGlvbihldikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImtleVVwOiB0ZXh0Q29udGVudD1cIiArIGV2LnRhcmdldC50ZXh0Q29udGVudCArIFwiLCB2YWx1ZT1cIiArIHRoaXMudmFsdWUgKyBcIiwgcGxhY2Vob2xkZXI9XCIgKyB0aGlzLnBsYWNlaG9sZGVyKTtcblxuICAgICAgICBpZiAoIWV2LnRhcmdldC50ZXh0Q29udGVudCkge1xuICAgICAgICAgICAgdGhpcy5zaG93UGxhY2Vob2xkZXIodHJ1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMucGxhY2Vob2xkZXIpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSBldi50YXJnZXQudGV4dENvbnRlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXYua2V5ID09PSBLZXkuRU5URVIpIHtcbiAgICAgICAgICAgIHRoaXMub25GaW5pc2goZXYpO1xuICAgICAgICB9IGVsc2UgaWYgKGV2LmtleSA9PT0gS2V5LkVTQ0FQRSkge1xuICAgICAgICAgICAgdGhpcy5jYW5jZWxFZGl0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImtleVVwOiB0ZXh0Q29udGVudD1cIiArIGV2LnRhcmdldC50ZXh0Q29udGVudCArIFwiLCB2YWx1ZT1cIiArIHRoaXMudmFsdWUgKyBcIiwgcGxhY2Vob2xkZXI9XCIgKyB0aGlzLnBsYWNlaG9sZGVyKTtcbiAgICB9LFxuXG4gICAgb25DbGlja0RpdjogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgaWYgKCF0aGlzLnByb3BzLmVkaXRhYmxlKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBwaGFzZTogdGhpcy5QaGFzZXMuRWRpdCxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uRm9jdXM6IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIC8vZXYudGFyZ2V0LnNldFNlbGVjdGlvblJhbmdlKDAsIGV2LnRhcmdldC50ZXh0Q29udGVudC5sZW5ndGgpO1xuXG4gICAgICAgIGNvbnN0IG5vZGUgPSBldi50YXJnZXQuY2hpbGROb2Rlc1swXTtcbiAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKTtcbiAgICAgICAgICAgIHJhbmdlLnNldFN0YXJ0KG5vZGUsIDApO1xuICAgICAgICAgICAgcmFuZ2Uuc2V0RW5kKG5vZGUsIG5vZGUubGVuZ3RoKTtcblxuICAgICAgICAgICAgY29uc3Qgc2VsID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuICAgICAgICAgICAgc2VsLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgICAgICAgc2VsLmFkZFJhbmdlKHJhbmdlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbkZpbmlzaDogZnVuY3Rpb24oZXYsIHNob3VsZFN1Ym1pdCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgY29uc3Qgc3VibWl0ID0gKGV2LmtleSA9PT0gS2V5LkVOVEVSKSB8fCBzaG91bGRTdWJtaXQ7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGhhc2U6IHRoaXMuUGhhc2VzLkRpc3BsYXksXG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlICE9PSB0aGlzLnByb3BzLmluaXRpYWxWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHNlbGYub25WYWx1ZUNoYW5nZWQoc3VibWl0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uQmx1cjogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgY29uc3Qgc2VsID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuICAgICAgICBzZWwucmVtb3ZlQWxsUmFuZ2VzKCk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMuYmx1clRvQ2FuY2VsKSB7XG4gICAgICAgICAgICB0aGlzLmNhbmNlbEVkaXQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMub25GaW5pc2goZXYsIHRoaXMucHJvcHMuYmx1clRvU3VibWl0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2hvd1BsYWNlaG9sZGVyKCF0aGlzLnZhbHVlKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3Qge2NsYXNzTmFtZSwgZWRpdGFibGUsIGluaXRpYWxWYWx1ZSwgbGFiZWwsIGxhYmVsQ2xhc3NOYW1lfSA9IHRoaXMucHJvcHM7XG4gICAgICAgIGxldCBlZGl0YWJsZUVsO1xuXG4gICAgICAgIGlmICghZWRpdGFibGUgfHwgKHRoaXMuc3RhdGUucGhhc2UgPT09IHRoaXMuUGhhc2VzLkRpc3BsYXkgJiYgKGxhYmVsIHx8IGxhYmVsQ2xhc3NOYW1lKSAmJiAhdGhpcy52YWx1ZSkpIHtcbiAgICAgICAgICAgIC8vIHNob3cgdGhlIGxhYmVsXG4gICAgICAgICAgICBlZGl0YWJsZUVsID0gPGRpdiBjbGFzc05hbWU9e2NsYXNzTmFtZSArIFwiIFwiICsgbGFiZWxDbGFzc05hbWV9IG9uQ2xpY2s9e3RoaXMub25DbGlja0Rpdn0+XG4gICAgICAgICAgICAgICAgeyBsYWJlbCB8fCBpbml0aWFsVmFsdWUgfVxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gc2hvdyB0aGUgY29udGVudCBlZGl0YWJsZSBkaXYsIGJ1dCBtYW51YWxseSBtYW5hZ2UgaXRzIGNvbnRlbnRzIGFzIHJlYWN0IGFuZCBjb250ZW50RWRpdGFibGUgZG9uJ3QgcGxheSBuaWNlIHRvZ2V0aGVyXG4gICAgICAgICAgICBlZGl0YWJsZUVsID0gPGRpdiByZWY9e3RoaXMuX2VkaXRhYmxlX2Rpdn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRFZGl0YWJsZT17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXt0aGlzLm9uS2V5RG93bn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5VXA9e3RoaXMub25LZXlVcH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRm9jdXM9e3RoaXMub25Gb2N1c31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJ9IC8+O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVkaXRhYmxlRWw7XG4gICAgfSxcbn0pO1xuIl19