"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const InteractiveTooltipContainerId = "mx_InteractiveTooltip_Container"; // If the distance from tooltip to window edge is below this value, the tooltip
// will flip around to the other side of the target.

const MIN_SAFE_DISTANCE_TO_WINDOW_EDGE = 20;

function getOrCreateContainer() {
  let container = document.getElementById(InteractiveTooltipContainerId);

  if (!container) {
    container = document.createElement("div");
    container.id = InteractiveTooltipContainerId;
    document.body.appendChild(container);
  }

  return container;
}

function isInRect(x, y, rect) {
  const {
    top,
    right,
    bottom,
    left
  } = rect;
  return x >= left && x <= right && y >= top && y <= bottom;
}
/**
 * Returns the positive slope of the diagonal of the rect.
 *
 * @param {DOMRect} rect
 * @return {integer}
 */


function getDiagonalSlope(rect) {
  const {
    top,
    right,
    bottom,
    left
  } = rect;
  return (bottom - top) / (right - left);
}

function isInUpperLeftHalf(x, y, rect) {
  const {
    bottom,
    left
  } = rect; // Negative slope because Y values grow downwards and for this case, the
  // diagonal goes from larger to smaller Y values.

  const diagonalSlope = getDiagonalSlope(rect) * -1;
  return isInRect(x, y, rect) && y <= bottom + diagonalSlope * (x - left);
}

function isInLowerRightHalf(x, y, rect) {
  const {
    bottom,
    left
  } = rect; // Negative slope because Y values grow downwards and for this case, the
  // diagonal goes from larger to smaller Y values.

  const diagonalSlope = getDiagonalSlope(rect) * -1;
  return isInRect(x, y, rect) && y >= bottom + diagonalSlope * (x - left);
}

function isInUpperRightHalf(x, y, rect) {
  const {
    top,
    left
  } = rect; // Positive slope because Y values grow downwards and for this case, the
  // diagonal goes from smaller to larger Y values.

  const diagonalSlope = getDiagonalSlope(rect) * 1;
  return isInRect(x, y, rect) && y <= top + diagonalSlope * (x - left);
}

function isInLowerLeftHalf(x, y, rect) {
  const {
    top,
    left
  } = rect; // Positive slope because Y values grow downwards and for this case, the
  // diagonal goes from smaller to larger Y values.

  const diagonalSlope = getDiagonalSlope(rect) * 1;
  return isInRect(x, y, rect) && y >= top + diagonalSlope * (x - left);
}
/*
 * This style of tooltip takes a "target" element as its child and centers the
 * tooltip along one edge of the target.
 */


class InteractiveTooltip extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "collectContentRect", element => {
      // We don't need to clean up when unmounting, so ignore
      if (!element) return;
      this.setState({
        contentRect: element.getBoundingClientRect()
      });
    });
    (0, _defineProperty2.default)(this, "collectTarget", element => {
      this.target = element;
    });
    (0, _defineProperty2.default)(this, "onMouseMove", ev => {
      const {
        clientX: x,
        clientY: y
      } = ev;
      const {
        contentRect
      } = this.state;
      const targetRect = this.target.getBoundingClientRect(); // When moving the mouse from the target to the tooltip, we create a
      // safe area that includes the tooltip, the target, and the trapezoid
      // ABCD between them:
      //                            ┌───────────┐
      //                            │           │
      //                            │           │
      //                          A └───E───F───┘ B
      //                                  V
      //                                 ┌─┐
      //                                 │ │
      //                                C└─┘D
      //
      // As long as the mouse remains inside the safe area, the tooltip will
      // stay open.

      const buffer = 50;

      if (isInRect(x, y, targetRect)) {
        return;
      }

      if (this.canTooltipFitAboveTarget()) {
        const contentRectWithBuffer = {
          top: contentRect.top - buffer,
          right: contentRect.right + buffer,
          bottom: contentRect.bottom,
          left: contentRect.left - buffer
        };
        const trapezoidLeft = {
          top: contentRect.bottom,
          right: targetRect.left,
          bottom: targetRect.bottom,
          left: contentRect.left - buffer
        };
        const trapezoidCenter = {
          top: contentRect.bottom,
          right: targetRect.right,
          bottom: targetRect.bottom,
          left: targetRect.left
        };
        const trapezoidRight = {
          top: contentRect.bottom,
          right: contentRect.right + buffer,
          bottom: targetRect.bottom,
          left: targetRect.right
        };

        if (isInRect(x, y, contentRectWithBuffer) || isInUpperRightHalf(x, y, trapezoidLeft) || isInRect(x, y, trapezoidCenter) || isInUpperLeftHalf(x, y, trapezoidRight)) {
          return;
        }
      } else {
        const contentRectWithBuffer = {
          top: contentRect.top,
          right: contentRect.right + buffer,
          bottom: contentRect.bottom + buffer,
          left: contentRect.left - buffer
        };
        const trapezoidLeft = {
          top: targetRect.top,
          right: targetRect.left,
          bottom: contentRect.top,
          left: contentRect.left - buffer
        };
        const trapezoidCenter = {
          top: targetRect.top,
          right: targetRect.right,
          bottom: contentRect.top,
          left: targetRect.left
        };
        const trapezoidRight = {
          top: targetRect.top,
          right: contentRect.right + buffer,
          bottom: contentRect.top,
          left: targetRect.right
        };

        if (isInRect(x, y, contentRectWithBuffer) || isInLowerRightHalf(x, y, trapezoidLeft) || isInRect(x, y, trapezoidCenter) || isInLowerLeftHalf(x, y, trapezoidRight)) {
          return;
        }
      }

      this.hideTooltip();
    });
    (0, _defineProperty2.default)(this, "onTargetMouseOver", ev => {
      this.showTooltip();
    });
    this.state = {
      contentRect: null,
      visible: false
    };
  }

  componentDidUpdate() {
    // Whenever this passthrough component updates, also render the tooltip
    // in a separate DOM tree. This allows the tooltip content to participate
    // the normal React rendering cycle: when this component re-renders, the
    // tooltip content re-renders.
    // Once we upgrade to React 16, this could be done a bit more naturally
    // using the portals feature instead.
    this.renderTooltip();
  }

  componentWillUnmount() {
    document.removeEventListener("mousemove", this.onMouseMove);
  }

  canTooltipFitAboveTarget() {
    const {
      contentRect
    } = this.state;
    const targetRect = this.target.getBoundingClientRect();
    const targetTop = targetRect.top + window.pageYOffset;
    return !contentRect || targetTop - contentRect.height > MIN_SAFE_DISTANCE_TO_WINDOW_EDGE;
  }

  showTooltip() {
    // Don't enter visible state if we haven't collected the target yet
    if (!this.target) {
      return;
    }

    this.setState({
      visible: true
    });

    if (this.props.onVisibilityChange) {
      this.props.onVisibilityChange(true);
    }

    document.addEventListener("mousemove", this.onMouseMove);
  }

  hideTooltip() {
    this.setState({
      visible: false
    });

    if (this.props.onVisibilityChange) {
      this.props.onVisibilityChange(false);
    }

    document.removeEventListener("mousemove", this.onMouseMove);
  }

  renderTooltip() {
    const {
      contentRect,
      visible
    } = this.state;

    if (this.props.forceHidden === true || !visible) {
      _reactDom.default.render(null, getOrCreateContainer());

      return null;
    }

    const targetRect = this.target.getBoundingClientRect(); // The window X and Y offsets are to adjust position when zoomed in to page

    const targetLeft = targetRect.left + window.pageXOffset;
    const targetBottom = targetRect.bottom + window.pageYOffset;
    const targetTop = targetRect.top + window.pageYOffset; // Place the tooltip above the target by default. If we find that the
    // tooltip content would extend past the safe area towards the window
    // edge, flip around to below the target.

    const position = {};
    let chevronFace = null;

    if (this.canTooltipFitAboveTarget()) {
      position.bottom = window.innerHeight - targetTop;
      chevronFace = "bottom";
    } else {
      position.top = targetBottom;
      chevronFace = "top";
    } // Center the tooltip horizontally with the target's center.


    position.left = targetLeft + targetRect.width / 2;

    const chevron = /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_InteractiveTooltip_chevron_" + chevronFace
    });

    const menuClasses = (0, _classnames.default)({
      'mx_InteractiveTooltip': true,
      'mx_InteractiveTooltip_withChevron_top': chevronFace === 'top',
      'mx_InteractiveTooltip_withChevron_bottom': chevronFace === 'bottom'
    });
    const menuStyle = {};

    if (contentRect) {
      menuStyle.left = "-".concat(contentRect.width / 2, "px");
    }

    const tooltip = /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_InteractiveTooltip_wrapper",
      style: _objectSpread({}, position)
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: menuClasses,
      style: menuStyle,
      ref: this.collectContentRect
    }, chevron, this.props.content));

    _reactDom.default.render(tooltip, getOrCreateContainer());
  }

  render() {
    // We use `cloneElement` here to append some props to the child content
    // without using a wrapper element which could disrupt layout.
    return _react.default.cloneElement(this.props.children, {
      ref: this.collectTarget,
      onMouseOver: this.onTargetMouseOver
    });
  }

}

exports.default = InteractiveTooltip;
(0, _defineProperty2.default)(InteractiveTooltip, "propTypes", {
  // Content to show in the tooltip
  content: _propTypes.default.node.isRequired,
  // Function to call when visibility of the tooltip changes
  onVisibilityChange: _propTypes.default.func,
  // flag to forcefully hide this tooltip
  forceHidden: _propTypes.default.bool
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL0ludGVyYWN0aXZlVG9vbHRpcC5qcyJdLCJuYW1lcyI6WyJJbnRlcmFjdGl2ZVRvb2x0aXBDb250YWluZXJJZCIsIk1JTl9TQUZFX0RJU1RBTkNFX1RPX1dJTkRPV19FREdFIiwiZ2V0T3JDcmVhdGVDb250YWluZXIiLCJjb250YWluZXIiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiY3JlYXRlRWxlbWVudCIsImlkIiwiYm9keSIsImFwcGVuZENoaWxkIiwiaXNJblJlY3QiLCJ4IiwieSIsInJlY3QiLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJnZXREaWFnb25hbFNsb3BlIiwiaXNJblVwcGVyTGVmdEhhbGYiLCJkaWFnb25hbFNsb3BlIiwiaXNJbkxvd2VyUmlnaHRIYWxmIiwiaXNJblVwcGVyUmlnaHRIYWxmIiwiaXNJbkxvd2VyTGVmdEhhbGYiLCJJbnRlcmFjdGl2ZVRvb2x0aXAiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwiZWxlbWVudCIsInNldFN0YXRlIiwiY29udGVudFJlY3QiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJ0YXJnZXQiLCJldiIsImNsaWVudFgiLCJjbGllbnRZIiwic3RhdGUiLCJ0YXJnZXRSZWN0IiwiYnVmZmVyIiwiY2FuVG9vbHRpcEZpdEFib3ZlVGFyZ2V0IiwiY29udGVudFJlY3RXaXRoQnVmZmVyIiwidHJhcGV6b2lkTGVmdCIsInRyYXBlem9pZENlbnRlciIsInRyYXBlem9pZFJpZ2h0IiwiaGlkZVRvb2x0aXAiLCJzaG93VG9vbHRpcCIsInZpc2libGUiLCJjb21wb25lbnREaWRVcGRhdGUiLCJyZW5kZXJUb29sdGlwIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwib25Nb3VzZU1vdmUiLCJ0YXJnZXRUb3AiLCJ3aW5kb3ciLCJwYWdlWU9mZnNldCIsImhlaWdodCIsInByb3BzIiwib25WaXNpYmlsaXR5Q2hhbmdlIiwiYWRkRXZlbnRMaXN0ZW5lciIsImZvcmNlSGlkZGVuIiwiUmVhY3RET00iLCJyZW5kZXIiLCJ0YXJnZXRMZWZ0IiwicGFnZVhPZmZzZXQiLCJ0YXJnZXRCb3R0b20iLCJwb3NpdGlvbiIsImNoZXZyb25GYWNlIiwiaW5uZXJIZWlnaHQiLCJ3aWR0aCIsImNoZXZyb24iLCJtZW51Q2xhc3NlcyIsIm1lbnVTdHlsZSIsInRvb2x0aXAiLCJjb2xsZWN0Q29udGVudFJlY3QiLCJjb250ZW50IiwiY2xvbmVFbGVtZW50IiwiY2hpbGRyZW4iLCJyZWYiLCJjb2xsZWN0VGFyZ2V0Iiwib25Nb3VzZU92ZXIiLCJvblRhcmdldE1vdXNlT3ZlciIsIlByb3BUeXBlcyIsIm5vZGUiLCJpc1JlcXVpcmVkIiwiZnVuYyIsImJvb2wiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7QUFFQSxNQUFNQSw2QkFBNkIsR0FBRyxpQ0FBdEMsQyxDQUVBO0FBQ0E7O0FBQ0EsTUFBTUMsZ0NBQWdDLEdBQUcsRUFBekM7O0FBRUEsU0FBU0Msb0JBQVQsR0FBZ0M7QUFDNUIsTUFBSUMsU0FBUyxHQUFHQyxRQUFRLENBQUNDLGNBQVQsQ0FBd0JMLDZCQUF4QixDQUFoQjs7QUFFQSxNQUFJLENBQUNHLFNBQUwsRUFBZ0I7QUFDWkEsSUFBQUEsU0FBUyxHQUFHQyxRQUFRLENBQUNFLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBWjtBQUNBSCxJQUFBQSxTQUFTLENBQUNJLEVBQVYsR0FBZVAsNkJBQWY7QUFDQUksSUFBQUEsUUFBUSxDQUFDSSxJQUFULENBQWNDLFdBQWQsQ0FBMEJOLFNBQTFCO0FBQ0g7O0FBRUQsU0FBT0EsU0FBUDtBQUNIOztBQUVELFNBQVNPLFFBQVQsQ0FBa0JDLENBQWxCLEVBQXFCQyxDQUFyQixFQUF3QkMsSUFBeEIsRUFBOEI7QUFDMUIsUUFBTTtBQUFFQyxJQUFBQSxHQUFGO0FBQU9DLElBQUFBLEtBQVA7QUFB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RTNDQyxNQUFBQSxXQUFXLEVBQUUsS0FBS0M7QUFGeUIsS0FBeEMsQ0FBUDtBQUlIOztBQW5QMkQ7Ozs4QkFBM0N4RCxrQixlQUNFO0FBQ2Y7QUFDQWtELEVBQUFBLE9BQU8sRUFBRU8sbUJBQVVDLElBQVYsQ0FBZUMsVUFGVDtBQUdmO0FBQ0ExQixFQUFBQSxrQkFBa0IsRUFBRXdCLG1CQUFVRyxJQUpmO0FBS2Y7QUFDQXpCLEVBQUFBLFdBQVcsRUFBRXNCLG1CQUFVSTtBQU5SLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFJlYWN0RE9NIGZyb20gJ3JlYWN0LWRvbSc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5cbmNvbnN0IEludGVyYWN0aXZlVG9vbHRpcENvbnRhaW5lcklkID0gXCJteF9JbnRlcmFjdGl2ZVRvb2x0aXBfQ29udGFpbmVyXCI7XG5cbi8vIElmIHRoZSBkaXN0YW5jZSBmcm9tIHRvb2x0aXAgdG8gd2luZG93IGVkZ2UgaXMgYmVsb3cgdGhpcyB2YWx1ZSwgdGhlIHRvb2x0aXBcbi8vIHdpbGwgZmxpcCBhcm91bmQgdG8gdGhlIG90aGVyIHNpZGUgb2YgdGhlIHRhcmdldC5cbmNvbnN0IE1JTl9TQUZFX0RJU1RBTkNFX1RPX1dJTkRPV19FREdFID0gMjA7XG5cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlQ29udGFpbmVyKCkge1xuICAgIGxldCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChJbnRlcmFjdGl2ZVRvb2x0aXBDb250YWluZXJJZCk7XG5cbiAgICBpZiAoIWNvbnRhaW5lcikge1xuICAgICAgICBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBjb250YWluZXIuaWQgPSBJbnRlcmFjdGl2ZVRvb2x0aXBDb250YWluZXJJZDtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBjb250YWluZXI7XG59XG5cbmZ1bmN0aW9uIGlzSW5SZWN0KHgsIHksIHJlY3QpIHtcbiAgICBjb25zdCB7IHRvcCwgcmlnaHQsIGJvdHRvbSwgbGVmdCB9ID0gcmVjdDtcbiAgICByZXR1cm4geCA+PSBsZWZ0ICYmIHggPD0gcmlnaHQgJiYgeSA+PSB0b3AgJiYgeSA8PSBib3R0b207XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgcG9zaXRpdmUgc2xvcGUgb2YgdGhlIGRpYWdvbmFsIG9mIHRoZSByZWN0LlxuICpcbiAqIEBwYXJhbSB7RE9NUmVjdH0gcmVjdFxuICogQHJldHVybiB7aW50ZWdlcn1cbiAqL1xuZnVuY3Rpb24gZ2V0RGlhZ29uYWxTbG9wZShyZWN0KSB7XG4gICAgY29uc3QgeyB0b3AsIHJpZ2h0LCBib3R0b20sIGxlZnQgfSA9IHJlY3Q7XG4gICAgcmV0dXJuIChib3R0b20gLSB0b3ApIC8gKHJpZ2h0IC0gbGVmdCk7XG59XG5cbmZ1bmN0aW9uIGlzSW5VcHBlckxlZnRIYWxmKHgsIHksIHJlY3QpIHtcbiAgICBjb25zdCB7IGJvdHRvbSwgbGVmdCB9ID0gcmVjdDtcbiAgICAvLyBOZWdhdGl2ZSBzbG9wZSBiZWNhdXNlIFkgdmFsdWVzIGdyb3cgZG93bndhcmRzIGFuZCBmb3IgdGhpcyBjYXNlLCB0aGVcbiAgICAvLyBkaWFnb25hbCBnb2VzIGZyb20gbGFyZ2VyIHRvIHNtYWxsZXIgWSB2YWx1ZXMuXG4gICAgY29uc3QgZGlhZ29uYWxTbG9wZSA9IGdldERpYWdvbmFsU2xvcGUocmVjdCkgKiAtMTtcbiAgICByZXR1cm4gaXNJblJlY3QoeCwgeSwgcmVjdCkgJiYgKHkgPD0gYm90dG9tICsgZGlhZ29uYWxTbG9wZSAqICh4IC0gbGVmdCkpO1xufVxuXG5mdW5jdGlvbiBpc0luTG93ZXJSaWdodEhhbGYoeCwgeSwgcmVjdCkge1xuICAgIGNvbnN0IHsgYm90dG9tLCBsZWZ0IH0gPSByZWN0O1xuICAgIC8vIE5lZ2F0aXZlIHNsb3BlIGJlY2F1c2UgWSB2YWx1ZXMgZ3JvdyBkb3dud2FyZHMgYW5kIGZvciB0aGlzIGNhc2UsIHRoZVxuICAgIC8vIGRpYWdvbmFsIGdvZXMgZnJvbSBsYXJnZXIgdG8gc21hbGxlciBZIHZhbHVlcy5cbiAgICBjb25zdCBkaWFnb25hbFNsb3BlID0gZ2V0RGlhZ29uYWxTbG9wZShyZWN0KSAqIC0xO1xuICAgIHJldHVybiBpc0luUmVjdCh4LCB5LCByZWN0KSAmJiAoeSA+PSBib3R0b20gKyBkaWFnb25hbFNsb3BlICogKHggLSBsZWZ0KSk7XG59XG5cbmZ1bmN0aW9uIGlzSW5VcHBlclJpZ2h0SGFsZih4LCB5LCByZWN0KSB7XG4gICAgY29uc3QgeyB0b3AsIGxlZnQgfSA9IHJlY3Q7XG4gICAgLy8gUG9zaXRpdmUgc2xvcGUgYmVjYXVzZSBZIHZhbHVlcyBncm93IGRvd253YXJkcyBhbmQgZm9yIHRoaXMgY2FzZSwgdGhlXG4gICAgLy8gZGlhZ29uYWwgZ29lcyBmcm9tIHNtYWxsZXIgdG8gbGFyZ2VyIFkgdmFsdWVzLlxuICAgIGNvbnN0IGRpYWdvbmFsU2xvcGUgPSBnZXREaWFnb25hbFNsb3BlKHJlY3QpICogMTtcbiAgICByZXR1cm4gaXNJblJlY3QoeCwgeSwgcmVjdCkgJiYgKHkgPD0gdG9wICsgZGlhZ29uYWxTbG9wZSAqICh4IC0gbGVmdCkpO1xufVxuXG5mdW5jdGlvbiBpc0luTG93ZXJMZWZ0SGFsZih4LCB5LCByZWN0KSB7XG4gICAgY29uc3QgeyB0b3AsIGxlZnQgfSA9IHJlY3Q7XG4gICAgLy8gUG9zaXRpdmUgc2xvcGUgYmVjYXVzZSBZIHZhbHVlcyBncm93IGRvd253YXJkcyBhbmQgZm9yIHRoaXMgY2FzZSwgdGhlXG4gICAgLy8gZGlhZ29uYWwgZ29lcyBmcm9tIHNtYWxsZXIgdG8gbGFyZ2VyIFkgdmFsdWVzLlxuICAgIGNvbnN0IGRpYWdvbmFsU2xvcGUgPSBnZXREaWFnb25hbFNsb3BlKHJlY3QpICogMTtcbiAgICByZXR1cm4gaXNJblJlY3QoeCwgeSwgcmVjdCkgJiYgKHkgPj0gdG9wICsgZGlhZ29uYWxTbG9wZSAqICh4IC0gbGVmdCkpO1xufVxuXG4vKlxuICogVGhpcyBzdHlsZSBvZiB0b29sdGlwIHRha2VzIGEgXCJ0YXJnZXRcIiBlbGVtZW50IGFzIGl0cyBjaGlsZCBhbmQgY2VudGVycyB0aGVcbiAqIHRvb2x0aXAgYWxvbmcgb25lIGVkZ2Ugb2YgdGhlIHRhcmdldC5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW50ZXJhY3RpdmVUb29sdGlwIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICAvLyBDb250ZW50IHRvIHNob3cgaW4gdGhlIHRvb2x0aXBcbiAgICAgICAgY29udGVudDogUHJvcFR5cGVzLm5vZGUuaXNSZXF1aXJlZCxcbiAgICAgICAgLy8gRnVuY3Rpb24gdG8gY2FsbCB3aGVuIHZpc2liaWxpdHkgb2YgdGhlIHRvb2x0aXAgY2hhbmdlc1xuICAgICAgICBvblZpc2liaWxpdHlDaGFuZ2U6IFByb3BUeXBlcy5mdW5jLFxuICAgICAgICAvLyBmbGFnIHRvIGZvcmNlZnVsbHkgaGlkZSB0aGlzIHRvb2x0aXBcbiAgICAgICAgZm9yY2VIaWRkZW46IFByb3BUeXBlcy5ib29sLFxuICAgIH07XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgY29udGVudFJlY3Q6IG51bGwsXG4gICAgICAgICAgICB2aXNpYmxlOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBjb21wb25lbnREaWRVcGRhdGUoKSB7XG4gICAgICAgIC8vIFdoZW5ldmVyIHRoaXMgcGFzc3Rocm91Z2ggY29tcG9uZW50IHVwZGF0ZXMsIGFsc28gcmVuZGVyIHRoZSB0b29sdGlwXG4gICAgICAgIC8vIGluIGEgc2VwYXJhdGUgRE9NIHRyZWUuIFRoaXMgYWxsb3dzIHRoZSB0b29sdGlwIGNvbnRlbnQgdG8gcGFydGljaXBhdGVcbiAgICAgICAgLy8gdGhlIG5vcm1hbCBSZWFjdCByZW5kZXJpbmcgY3ljbGU6IHdoZW4gdGhpcyBjb21wb25lbnQgcmUtcmVuZGVycywgdGhlXG4gICAgICAgIC8vIHRvb2x0aXAgY29udGVudCByZS1yZW5kZXJzLlxuICAgICAgICAvLyBPbmNlIHdlIHVwZ3JhZGUgdG8gUmVhY3QgMTYsIHRoaXMgY291bGQgYmUgZG9uZSBhIGJpdCBtb3JlIG5hdHVyYWxseVxuICAgICAgICAvLyB1c2luZyB0aGUgcG9ydGFscyBmZWF0dXJlIGluc3RlYWQuXG4gICAgICAgIHRoaXMucmVuZGVyVG9vbHRpcCgpO1xuICAgIH1cblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMub25Nb3VzZU1vdmUpO1xuICAgIH1cblxuICAgIGNvbGxlY3RDb250ZW50UmVjdCA9IChlbGVtZW50KSA9PiB7XG4gICAgICAgIC8vIFdlIGRvbid0IG5lZWQgdG8gY2xlYW4gdXAgd2hlbiB1bm1vdW50aW5nLCBzbyBpZ25vcmVcbiAgICAgICAgaWYgKCFlbGVtZW50KSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBjb250ZW50UmVjdDogZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29sbGVjdFRhcmdldCA9IChlbGVtZW50KSA9PiB7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gZWxlbWVudDtcbiAgICB9XG5cbiAgICBjYW5Ub29sdGlwRml0QWJvdmVUYXJnZXQoKSB7XG4gICAgICAgIGNvbnN0IHsgY29udGVudFJlY3QgfSA9IHRoaXMuc3RhdGU7XG4gICAgICAgIGNvbnN0IHRhcmdldFJlY3QgPSB0aGlzLnRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3QgdGFyZ2V0VG9wID0gdGFyZ2V0UmVjdC50b3AgKyB3aW5kb3cucGFnZVlPZmZzZXQ7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAhY29udGVudFJlY3QgfHxcbiAgICAgICAgICAgICh0YXJnZXRUb3AgLSBjb250ZW50UmVjdC5oZWlnaHQgPiBNSU5fU0FGRV9ESVNUQU5DRV9UT19XSU5ET1dfRURHRSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBvbk1vdXNlTW92ZSA9IChldikgPT4ge1xuICAgICAgICBjb25zdCB7IGNsaWVudFg6IHgsIGNsaWVudFk6IHkgfSA9IGV2O1xuICAgICAgICBjb25zdCB7IGNvbnRlbnRSZWN0IH0gPSB0aGlzLnN0YXRlO1xuICAgICAgICBjb25zdCB0YXJnZXRSZWN0ID0gdGhpcy50YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgICAgLy8gV2hlbiBtb3ZpbmcgdGhlIG1vdXNlIGZyb20gdGhlIHRhcmdldCB0byB0aGUgdG9vbHRpcCwgd2UgY3JlYXRlIGFcbiAgICAgICAgLy8gc2FmZSBhcmVhIHRoYXQgaW5jbHVkZXMgdGhlIHRvb2x0aXAsIHRoZSB0YXJnZXQsIGFuZCB0aGUgdHJhcGV6b2lkXG4gICAgICAgIC8vIEFCQ0QgYmV0d2VlbiB0aGVtOlxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJBcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAg4pSCICAgICAgICAgICDilIJcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAg4pSCICAgICAgICAgICDilIJcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgIEEg4pSU4pSA4pSA4pSAReKUgOKUgOKUgEbilIDilIDilIDilJggQlxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pSM4pSA4pSQXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pSCIOKUglxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ+KUlOKUgOKUmERcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQXMgbG9uZyBhcyB0aGUgbW91c2UgcmVtYWlucyBpbnNpZGUgdGhlIHNhZmUgYXJlYSwgdGhlIHRvb2x0aXAgd2lsbFxuICAgICAgICAvLyBzdGF5IG9wZW4uXG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IDUwO1xuICAgICAgICBpZiAoaXNJblJlY3QoeCwgeSwgdGFyZ2V0UmVjdCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jYW5Ub29sdGlwRml0QWJvdmVUYXJnZXQoKSkge1xuICAgICAgICAgICAgY29uc3QgY29udGVudFJlY3RXaXRoQnVmZmVyID0ge1xuICAgICAgICAgICAgICAgIHRvcDogY29udGVudFJlY3QudG9wIC0gYnVmZmVyLFxuICAgICAgICAgICAgICAgIHJpZ2h0OiBjb250ZW50UmVjdC5yaWdodCArIGJ1ZmZlcixcbiAgICAgICAgICAgICAgICBib3R0b206IGNvbnRlbnRSZWN0LmJvdHRvbSxcbiAgICAgICAgICAgICAgICBsZWZ0OiBjb250ZW50UmVjdC5sZWZ0IC0gYnVmZmVyLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IHRyYXBlem9pZExlZnQgPSB7XG4gICAgICAgICAgICAgICAgdG9wOiBjb250ZW50UmVjdC5ib3R0b20sXG4gICAgICAgICAgICAgICAgcmlnaHQ6IHRhcmdldFJlY3QubGVmdCxcbiAgICAgICAgICAgICAgICBib3R0b206IHRhcmdldFJlY3QuYm90dG9tLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGNvbnRlbnRSZWN0LmxlZnQgLSBidWZmZXIsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgdHJhcGV6b2lkQ2VudGVyID0ge1xuICAgICAgICAgICAgICAgIHRvcDogY29udGVudFJlY3QuYm90dG9tLFxuICAgICAgICAgICAgICAgIHJpZ2h0OiB0YXJnZXRSZWN0LnJpZ2h0LFxuICAgICAgICAgICAgICAgIGJvdHRvbTogdGFyZ2V0UmVjdC5ib3R0b20sXG4gICAgICAgICAgICAgICAgbGVmdDogdGFyZ2V0UmVjdC5sZWZ0LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IHRyYXBlem9pZFJpZ2h0ID0ge1xuICAgICAgICAgICAgICAgIHRvcDogY29udGVudFJlY3QuYm90dG9tLFxuICAgICAgICAgICAgICAgIHJpZ2h0OiBjb250ZW50UmVjdC5yaWdodCArIGJ1ZmZlcixcbiAgICAgICAgICAgICAgICBib3R0b206IHRhcmdldFJlY3QuYm90dG9tLFxuICAgICAgICAgICAgICAgIGxlZnQ6IHRhcmdldFJlY3QucmlnaHQsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgaXNJblJlY3QoeCwgeSwgY29udGVudFJlY3RXaXRoQnVmZmVyKSB8fFxuICAgICAgICAgICAgICAgIGlzSW5VcHBlclJpZ2h0SGFsZih4LCB5LCB0cmFwZXpvaWRMZWZ0KSB8fFxuICAgICAgICAgICAgICAgIGlzSW5SZWN0KHgsIHksIHRyYXBlem9pZENlbnRlcikgfHxcbiAgICAgICAgICAgICAgICBpc0luVXBwZXJMZWZ0SGFsZih4LCB5LCB0cmFwZXpvaWRSaWdodClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRSZWN0V2l0aEJ1ZmZlciA9IHtcbiAgICAgICAgICAgICAgICB0b3A6IGNvbnRlbnRSZWN0LnRvcCxcbiAgICAgICAgICAgICAgICByaWdodDogY29udGVudFJlY3QucmlnaHQgKyBidWZmZXIsXG4gICAgICAgICAgICAgICAgYm90dG9tOiBjb250ZW50UmVjdC5ib3R0b20gKyBidWZmZXIsXG4gICAgICAgICAgICAgICAgbGVmdDogY29udGVudFJlY3QubGVmdCAtIGJ1ZmZlcixcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCB0cmFwZXpvaWRMZWZ0ID0ge1xuICAgICAgICAgICAgICAgIHRvcDogdGFyZ2V0UmVjdC50b3AsXG4gICAgICAgICAgICAgICAgcmlnaHQ6IHRhcmdldFJlY3QubGVmdCxcbiAgICAgICAgICAgICAgICBib3R0b206IGNvbnRlbnRSZWN0LnRvcCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBjb250ZW50UmVjdC5sZWZ0IC0gYnVmZmVyLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IHRyYXBlem9pZENlbnRlciA9IHtcbiAgICAgICAgICAgICAgICB0b3A6IHRhcmdldFJlY3QudG9wLFxuICAgICAgICAgICAgICAgIHJpZ2h0OiB0YXJnZXRSZWN0LnJpZ2h0LFxuICAgICAgICAgICAgICAgIGJvdHRvbTogY29udGVudFJlY3QudG9wLFxuICAgICAgICAgICAgICAgIGxlZnQ6IHRhcmdldFJlY3QubGVmdCxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCB0cmFwZXpvaWRSaWdodCA9IHtcbiAgICAgICAgICAgICAgICB0b3A6IHRhcmdldFJlY3QudG9wLFxuICAgICAgICAgICAgICAgIHJpZ2h0OiBjb250ZW50UmVjdC5yaWdodCArIGJ1ZmZlcixcbiAgICAgICAgICAgICAgICBib3R0b206IGNvbnRlbnRSZWN0LnRvcCxcbiAgICAgICAgICAgICAgICBsZWZ0OiB0YXJnZXRSZWN0LnJpZ2h0LFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIGlzSW5SZWN0KHgsIHksIGNvbnRlbnRSZWN0V2l0aEJ1ZmZlcikgfHxcbiAgICAgICAgICAgICAgICBpc0luTG93ZXJSaWdodEhhbGYoeCwgeSwgdHJhcGV6b2lkTGVmdCkgfHxcbiAgICAgICAgICAgICAgICBpc0luUmVjdCh4LCB5LCB0cmFwZXpvaWRDZW50ZXIpIHx8XG4gICAgICAgICAgICAgICAgaXNJbkxvd2VyTGVmdEhhbGYoeCwgeSwgdHJhcGV6b2lkUmlnaHQpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmhpZGVUb29sdGlwKCk7XG4gICAgfVxuXG4gICAgb25UYXJnZXRNb3VzZU92ZXIgPSAoZXYpID0+IHtcbiAgICAgICAgdGhpcy5zaG93VG9vbHRpcCgpO1xuICAgIH1cblxuICAgIHNob3dUb29sdGlwKCkge1xuICAgICAgICAvLyBEb24ndCBlbnRlciB2aXNpYmxlIHN0YXRlIGlmIHdlIGhhdmVuJ3QgY29sbGVjdGVkIHRoZSB0YXJnZXQgeWV0XG4gICAgICAgIGlmICghdGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHZpc2libGU6IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5vblZpc2liaWxpdHlDaGFuZ2UpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25WaXNpYmlsaXR5Q2hhbmdlKHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5vbk1vdXNlTW92ZSk7XG4gICAgfVxuXG4gICAgaGlkZVRvb2x0aXAoKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgdmlzaWJsZTogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5vblZpc2liaWxpdHlDaGFuZ2UpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25WaXNpYmlsaXR5Q2hhbmdlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMub25Nb3VzZU1vdmUpO1xuICAgIH1cblxuICAgIHJlbmRlclRvb2x0aXAoKSB7XG4gICAgICAgIGNvbnN0IHsgY29udGVudFJlY3QsIHZpc2libGUgfSA9IHRoaXMuc3RhdGU7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmZvcmNlSGlkZGVuID09PSB0cnVlIHx8ICF2aXNpYmxlKSB7XG4gICAgICAgICAgICBSZWFjdERPTS5yZW5kZXIobnVsbCwgZ2V0T3JDcmVhdGVDb250YWluZXIoKSk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRhcmdldFJlY3QgPSB0aGlzLnRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgICAgICAvLyBUaGUgd2luZG93IFggYW5kIFkgb2Zmc2V0cyBhcmUgdG8gYWRqdXN0IHBvc2l0aW9uIHdoZW4gem9vbWVkIGluIHRvIHBhZ2VcbiAgICAgICAgY29uc3QgdGFyZ2V0TGVmdCA9IHRhcmdldFJlY3QubGVmdCArIHdpbmRvdy5wYWdlWE9mZnNldDtcbiAgICAgICAgY29uc3QgdGFyZ2V0Qm90dG9tID0gdGFyZ2V0UmVjdC5ib3R0b20gKyB3aW5kb3cucGFnZVlPZmZzZXQ7XG4gICAgICAgIGNvbnN0IHRhcmdldFRvcCA9IHRhcmdldFJlY3QudG9wICsgd2luZG93LnBhZ2VZT2Zmc2V0O1xuXG4gICAgICAgIC8vIFBsYWNlIHRoZSB0b29sdGlwIGFib3ZlIHRoZSB0YXJnZXQgYnkgZGVmYXVsdC4gSWYgd2UgZmluZCB0aGF0IHRoZVxuICAgICAgICAvLyB0b29sdGlwIGNvbnRlbnQgd291bGQgZXh0ZW5kIHBhc3QgdGhlIHNhZmUgYXJlYSB0b3dhcmRzIHRoZSB3aW5kb3dcbiAgICAgICAgLy8gZWRnZSwgZmxpcCBhcm91bmQgdG8gYmVsb3cgdGhlIHRhcmdldC5cbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSB7fTtcbiAgICAgICAgbGV0IGNoZXZyb25GYWNlID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuY2FuVG9vbHRpcEZpdEFib3ZlVGFyZ2V0KCkpIHtcbiAgICAgICAgICAgIHBvc2l0aW9uLmJvdHRvbSA9IHdpbmRvdy5pbm5lckhlaWdodCAtIHRhcmdldFRvcDtcbiAgICAgICAgICAgIGNoZXZyb25GYWNlID0gXCJib3R0b21cIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBvc2l0aW9uLnRvcCA9IHRhcmdldEJvdHRvbTtcbiAgICAgICAgICAgIGNoZXZyb25GYWNlID0gXCJ0b3BcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENlbnRlciB0aGUgdG9vbHRpcCBob3Jpem9udGFsbHkgd2l0aCB0aGUgdGFyZ2V0J3MgY2VudGVyLlxuICAgICAgICBwb3NpdGlvbi5sZWZ0ID0gdGFyZ2V0TGVmdCArIHRhcmdldFJlY3Qud2lkdGggLyAyO1xuXG4gICAgICAgIGNvbnN0IGNoZXZyb24gPSA8ZGl2IGNsYXNzTmFtZT17XCJteF9JbnRlcmFjdGl2ZVRvb2x0aXBfY2hldnJvbl9cIiArIGNoZXZyb25GYWNlfSAvPjtcblxuICAgICAgICBjb25zdCBtZW51Q2xhc3NlcyA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgJ214X0ludGVyYWN0aXZlVG9vbHRpcCc6IHRydWUsXG4gICAgICAgICAgICAnbXhfSW50ZXJhY3RpdmVUb29sdGlwX3dpdGhDaGV2cm9uX3RvcCc6IGNoZXZyb25GYWNlID09PSAndG9wJyxcbiAgICAgICAgICAgICdteF9JbnRlcmFjdGl2ZVRvb2x0aXBfd2l0aENoZXZyb25fYm90dG9tJzogY2hldnJvbkZhY2UgPT09ICdib3R0b20nLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBtZW51U3R5bGUgPSB7fTtcbiAgICAgICAgaWYgKGNvbnRlbnRSZWN0KSB7XG4gICAgICAgICAgICBtZW51U3R5bGUubGVmdCA9IGAtJHtjb250ZW50UmVjdC53aWR0aCAvIDJ9cHhgO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdG9vbHRpcCA9IDxkaXYgY2xhc3NOYW1lPVwibXhfSW50ZXJhY3RpdmVUb29sdGlwX3dyYXBwZXJcIiBzdHlsZT17ey4uLnBvc2l0aW9ufX0+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17bWVudUNsYXNzZXN9XG4gICAgICAgICAgICAgICAgc3R5bGU9e21lbnVTdHlsZX1cbiAgICAgICAgICAgICAgICByZWY9e3RoaXMuY29sbGVjdENvbnRlbnRSZWN0fVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHtjaGV2cm9ufVxuICAgICAgICAgICAgICAgIHt0aGlzLnByb3BzLmNvbnRlbnR9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+O1xuXG4gICAgICAgIFJlYWN0RE9NLnJlbmRlcih0b29sdGlwLCBnZXRPckNyZWF0ZUNvbnRhaW5lcigpKTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIC8vIFdlIHVzZSBgY2xvbmVFbGVtZW50YCBoZXJlIHRvIGFwcGVuZCBzb21lIHByb3BzIHRvIHRoZSBjaGlsZCBjb250ZW50XG4gICAgICAgIC8vIHdpdGhvdXQgdXNpbmcgYSB3cmFwcGVyIGVsZW1lbnQgd2hpY2ggY291bGQgZGlzcnVwdCBsYXlvdXQuXG4gICAgICAgIHJldHVybiBSZWFjdC5jbG9uZUVsZW1lbnQodGhpcy5wcm9wcy5jaGlsZHJlbiwge1xuICAgICAgICAgICAgcmVmOiB0aGlzLmNvbGxlY3RUYXJnZXQsXG4gICAgICAgICAgICBvbk1vdXNlT3ZlcjogdGhpcy5vblRhcmdldE1vdXNlT3ZlcixcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl19