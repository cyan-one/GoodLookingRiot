"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _velocityAnimate = _interopRequireDefault(require("velocity-animate"));

var _propTypes = _interopRequireDefault(require("prop-types"));

/**
 * The Velociraptor contains components and animates transitions with velocity.
 * It will only pick up direct changes to properties ('left', currently), and so
 * will not work for animating positional changes where the position is implicit
 * from DOM order. This makes it a lot simpler and lighter: if you need fully
 * automatic positional animation, look at react-shuffle or similar libraries.
 */
class Velociraptor extends _react.default.Component {
  constructor(props) {
    super(props);
    this.nodes = {};

    this._updateChildren(this.props.children);
  }

  componentDidUpdate() {
    this._updateChildren(this.props.children);
  }

  _updateChildren(newChildren) {
    const oldChildren = this.children || {};
    this.children = {};

    _react.default.Children.toArray(newChildren).forEach(c => {
      if (oldChildren[c.key]) {
        const old = oldChildren[c.key];

        const oldNode = _reactDom.default.findDOMNode(this.nodes[old.key]);

        if (oldNode && oldNode.style.left !== c.props.style.left) {
          (0, _velocityAnimate.default)(oldNode, {
            left: c.props.style.left
          }, this.props.transition).then(() => {
            // special case visibility because it's nonsensical to animate an invisible element
            // so we always hidden->visible pre-transition and visible->hidden after
            if (oldNode.style.visibility === 'visible' && c.props.style.visibility === 'hidden') {
              oldNode.style.visibility = c.props.style.visibility;
            }
          }); //console.log("translation: "+oldNode.style.left+" -> "+c.props.style.left);
        }

        if (oldNode && oldNode.style.visibility === 'hidden' && c.props.style.visibility === 'visible') {
          oldNode.style.visibility = c.props.style.visibility;
        } // clone the old element with the props (and children) of the new element
        // so prop updates are still received by the children.


        this.children[c.key] = _react.default.cloneElement(old, c.props, c.props.children);
      } else {
        // new element. If we have a startStyle, use that as the style and go through
        // the enter animations
        const newProps = {};
        const restingStyle = c.props.style;
        const startStyles = this.props.startStyles;

        if (startStyles.length > 0) {
          const startStyle = startStyles[0];
          newProps.style = startStyle; // console.log("mounted@startstyle0: "+JSON.stringify(startStyle));
        }

        newProps.ref = n => this._collectNode(c.key, n, restingStyle);

        this.children[c.key] = _react.default.cloneElement(c, newProps);
      }
    });
  }

  _collectNode(k, node, restingStyle) {
    if (node && this.nodes[k] === undefined && this.props.startStyles.length > 0) {
      const startStyles = this.props.startStyles;
      const transitionOpts = this.props.enterTransitionOpts;

      const domNode = _reactDom.default.findDOMNode(node); // start from startStyle 1: 0 is the one we gave it
      // to start with, so now we animate 1 etc.


      for (var i = 1; i < startStyles.length; ++i) {
        (0, _velocityAnimate.default)(domNode, startStyles[i], transitionOpts[i - 1]);
        /*
        console.log("start:",
                    JSON.stringify(transitionOpts[i-1]),
                    "->",
                    JSON.stringify(startStyles[i]),
                    );
        */
      } // and then we animate to the resting state


      (0, _velocityAnimate.default)(domNode, restingStyle, transitionOpts[i - 1]).then(() => {
        // once we've reached the resting state, hide the element if
        // appropriate
        domNode.style.visibility = restingStyle.visibility;
      });
      /*
      console.log("enter:",
                  JSON.stringify(transitionOpts[i-1]),
                  "->",
                  JSON.stringify(restingStyle));
      */
    } else if (node === null) {
      // Velocity stores data on elements using the jQuery .data()
      // method, and assumes you'll be using jQuery's .remove() to
      // remove the element, but we don't use jQuery, so we need to
      // blow away the element's data explicitly otherwise it will leak.
      // This uses Velocity's internal jQuery compatible wrapper.
      // See the bug at
      // https://github.com/julianshapiro/velocity/issues/300
      // and the FAQ entry, "Preventing memory leaks when
      // creating/destroying large numbers of elements"
      // (https://github.com/julianshapiro/velocity/issues/47)
      const domNode = _reactDom.default.findDOMNode(this.nodes[k]);

      if (domNode) _velocityAnimate.default.Utilities.removeData(domNode);
    }

    this.nodes[k] = node;
  }

  render() {
    return /*#__PURE__*/_react.default.createElement("span", null, Object.values(this.children));
  }

}

exports.default = Velociraptor;
(0, _defineProperty2.default)(Velociraptor, "propTypes", {
  // either a list of child nodes, or a single child.
  children: _propTypes.default.any,
  // optional transition information for changing existing children
  transition: _propTypes.default.object,
  // a list of state objects to apply to each child node in turn
  startStyles: _propTypes.default.array,
  // a list of transition options from the corresponding startStyle
  enterTransitionOpts: _propTypes.default.array
});
(0, _defineProperty2.default)(Velociraptor, "defaultProps", {
  startStyles: [],
  enterTransitionOpts: []
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9WZWxvY2lyYXB0b3IuanMiXSwibmFtZXMiOlsiVmVsb2NpcmFwdG9yIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwibm9kZXMiLCJfdXBkYXRlQ2hpbGRyZW4iLCJjaGlsZHJlbiIsImNvbXBvbmVudERpZFVwZGF0ZSIsIm5ld0NoaWxkcmVuIiwib2xkQ2hpbGRyZW4iLCJDaGlsZHJlbiIsInRvQXJyYXkiLCJmb3JFYWNoIiwiYyIsImtleSIsIm9sZCIsIm9sZE5vZGUiLCJSZWFjdERvbSIsImZpbmRET01Ob2RlIiwic3R5bGUiLCJsZWZ0IiwidHJhbnNpdGlvbiIsInRoZW4iLCJ2aXNpYmlsaXR5IiwiY2xvbmVFbGVtZW50IiwibmV3UHJvcHMiLCJyZXN0aW5nU3R5bGUiLCJzdGFydFN0eWxlcyIsImxlbmd0aCIsInN0YXJ0U3R5bGUiLCJyZWYiLCJuIiwiX2NvbGxlY3ROb2RlIiwiayIsIm5vZGUiLCJ1bmRlZmluZWQiLCJ0cmFuc2l0aW9uT3B0cyIsImVudGVyVHJhbnNpdGlvbk9wdHMiLCJkb21Ob2RlIiwiaSIsIlZlbG9jaXR5IiwiVXRpbGl0aWVzIiwicmVtb3ZlRGF0YSIsInJlbmRlciIsIk9iamVjdCIsInZhbHVlcyIsIlByb3BUeXBlcyIsImFueSIsIm9iamVjdCIsImFycmF5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOzs7Ozs7O0FBT2UsTUFBTUEsWUFBTixTQUEyQkMsZUFBTUMsU0FBakMsQ0FBMkM7QUFvQnREQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUTtBQUNmLFVBQU1BLEtBQU47QUFFQSxTQUFLQyxLQUFMLEdBQWEsRUFBYjs7QUFDQSxTQUFLQyxlQUFMLENBQXFCLEtBQUtGLEtBQUwsQ0FBV0csUUFBaEM7QUFDSDs7QUFFREMsRUFBQUEsa0JBQWtCLEdBQUc7QUFDakIsU0FBS0YsZUFBTCxDQUFxQixLQUFLRixLQUFMLENBQVdH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LEVBQWFFLHlCQUFTQyxTQUFULENBQW1CQyxVQUFuQixDQUE4QkosT0FBOUI7QUFDaEI7O0FBQ0QsU0FBS2xDLEtBQUwsQ0FBVzZCLENBQVgsSUFBZ0JDLElBQWhCO0FBQ0g7O0FBRURTLEVBQUFBLE1BQU0sR0FBRztBQUNMLHdCQUNJLDJDQUNNQyxNQUFNLENBQUNDLE1BQVAsQ0FBYyxLQUFLdkMsUUFBbkIsQ0FETixDQURKO0FBS0g7O0FBeklxRDs7OzhCQUFyQ1AsWSxlQUNFO0FBQ2Y7QUFDQU8sRUFBQUEsUUFBUSxFQUFFd0MsbUJBQVVDLEdBRkw7QUFJZjtBQUNBMUIsRUFBQUEsVUFBVSxFQUFFeUIsbUJBQVVFLE1BTFA7QUFPZjtBQUNBckIsRUFBQUEsV0FBVyxFQUFFbUIsbUJBQVVHLEtBUlI7QUFVZjtBQUNBWixFQUFBQSxtQkFBbUIsRUFBRVMsbUJBQVVHO0FBWGhCLEM7OEJBREZsRCxZLGtCQWVLO0FBQ2xCNEIsRUFBQUEsV0FBVyxFQUFFLEVBREs7QUFFbEJVLEVBQUFBLG1CQUFtQixFQUFFO0FBRkgsQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBSZWFjdERvbSBmcm9tIFwicmVhY3QtZG9tXCI7XG5pbXBvcnQgVmVsb2NpdHkgZnJvbSBcInZlbG9jaXR5LWFuaW1hdGVcIjtcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5cbi8qKlxuICogVGhlIFZlbG9jaXJhcHRvciBjb250YWlucyBjb21wb25lbnRzIGFuZCBhbmltYXRlcyB0cmFuc2l0aW9ucyB3aXRoIHZlbG9jaXR5LlxuICogSXQgd2lsbCBvbmx5IHBpY2sgdXAgZGlyZWN0IGNoYW5nZXMgdG8gcHJvcGVydGllcyAoJ2xlZnQnLCBjdXJyZW50bHkpLCBhbmQgc29cbiAqIHdpbGwgbm90IHdvcmsgZm9yIGFuaW1hdGluZyBwb3NpdGlvbmFsIGNoYW5nZXMgd2hlcmUgdGhlIHBvc2l0aW9uIGlzIGltcGxpY2l0XG4gKiBmcm9tIERPTSBvcmRlci4gVGhpcyBtYWtlcyBpdCBhIGxvdCBzaW1wbGVyIGFuZCBsaWdodGVyOiBpZiB5b3UgbmVlZCBmdWxseVxuICogYXV0b21hdGljIHBvc2l0aW9uYWwgYW5pbWF0aW9uLCBsb29rIGF0IHJlYWN0LXNodWZmbGUgb3Igc2ltaWxhciBsaWJyYXJpZXMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFZlbG9jaXJhcHRvciBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgLy8gZWl0aGVyIGEgbGlzdCBvZiBjaGlsZCBub2Rlcywgb3IgYSBzaW5nbGUgY2hpbGQuXG4gICAgICAgIGNoaWxkcmVuOiBQcm9wVHlwZXMuYW55LFxuXG4gICAgICAgIC8vIG9wdGlvbmFsIHRyYW5zaXRpb24gaW5mb3JtYXRpb24gZm9yIGNoYW5naW5nIGV4aXN0aW5nIGNoaWxkcmVuXG4gICAgICAgIHRyYW5zaXRpb246IFByb3BUeXBlcy5vYmplY3QsXG5cbiAgICAgICAgLy8gYSBsaXN0IG9mIHN0YXRlIG9iamVjdHMgdG8gYXBwbHkgdG8gZWFjaCBjaGlsZCBub2RlIGluIHR1cm5cbiAgICAgICAgc3RhcnRTdHlsZXM6IFByb3BUeXBlcy5hcnJheSxcblxuICAgICAgICAvLyBhIGxpc3Qgb2YgdHJhbnNpdGlvbiBvcHRpb25zIGZyb20gdGhlIGNvcnJlc3BvbmRpbmcgc3RhcnRTdHlsZVxuICAgICAgICBlbnRlclRyYW5zaXRpb25PcHRzOiBQcm9wVHlwZXMuYXJyYXksXG4gICAgfTtcblxuICAgIHN0YXRpYyBkZWZhdWx0UHJvcHMgPSB7XG4gICAgICAgIHN0YXJ0U3R5bGVzOiBbXSxcbiAgICAgICAgZW50ZXJUcmFuc2l0aW9uT3B0czogW10sXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLm5vZGVzID0ge307XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNoaWxkcmVuKHRoaXMucHJvcHMuY2hpbGRyZW4pO1xuICAgIH1cblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZSgpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlQ2hpbGRyZW4odGhpcy5wcm9wcy5jaGlsZHJlbik7XG4gICAgfVxuXG4gICAgX3VwZGF0ZUNoaWxkcmVuKG5ld0NoaWxkcmVuKSB7XG4gICAgICAgIGNvbnN0IG9sZENoaWxkcmVuID0gdGhpcy5jaGlsZHJlbiB8fCB7fTtcbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IHt9O1xuICAgICAgICBSZWFjdC5DaGlsZHJlbi50b0FycmF5KG5ld0NoaWxkcmVuKS5mb3JFYWNoKChjKSA9PiB7XG4gICAgICAgICAgICBpZiAob2xkQ2hpbGRyZW5bYy5rZXldKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkID0gb2xkQ2hpbGRyZW5bYy5rZXldO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZE5vZGUgPSBSZWFjdERvbS5maW5kRE9NTm9kZSh0aGlzLm5vZGVzW29sZC5rZXldKTtcblxuICAgICAgICAgICAgICAgIGlmIChvbGROb2RlICYmIG9sZE5vZGUuc3R5bGUubGVmdCAhPT0gYy5wcm9wcy5zdHlsZS5sZWZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5KG9sZE5vZGUsIHsgbGVmdDogYy5wcm9wcy5zdHlsZS5sZWZ0IH0sIHRoaXMucHJvcHMudHJhbnNpdGlvbikudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzcGVjaWFsIGNhc2UgdmlzaWJpbGl0eSBiZWNhdXNlIGl0J3Mgbm9uc2Vuc2ljYWwgdG8gYW5pbWF0ZSBhbiBpbnZpc2libGUgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc28gd2UgYWx3YXlzIGhpZGRlbi0+dmlzaWJsZSBwcmUtdHJhbnNpdGlvbiBhbmQgdmlzaWJsZS0+aGlkZGVuIGFmdGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob2xkTm9kZS5zdHlsZS52aXNpYmlsaXR5ID09PSAndmlzaWJsZScgJiYgYy5wcm9wcy5zdHlsZS52aXNpYmlsaXR5ID09PSAnaGlkZGVuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZE5vZGUuc3R5bGUudmlzaWJpbGl0eSA9IGMucHJvcHMuc3R5bGUudmlzaWJpbGl0eTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJ0cmFuc2xhdGlvbjogXCIrb2xkTm9kZS5zdHlsZS5sZWZ0K1wiIC0+IFwiK2MucHJvcHMuc3R5bGUubGVmdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChvbGROb2RlICYmIG9sZE5vZGUuc3R5bGUudmlzaWJpbGl0eSA9PT0gJ2hpZGRlbicgJiYgYy5wcm9wcy5zdHlsZS52aXNpYmlsaXR5ID09PSAndmlzaWJsZScpIHtcbiAgICAgICAgICAgICAgICAgICAgb2xkTm9kZS5zdHlsZS52aXNpYmlsaXR5ID0gYy5wcm9wcy5zdHlsZS52aXNpYmlsaXR5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBjbG9uZSB0aGUgb2xkIGVsZW1lbnQgd2l0aCB0aGUgcHJvcHMgKGFuZCBjaGlsZHJlbikgb2YgdGhlIG5ldyBlbGVtZW50XG4gICAgICAgICAgICAgICAgLy8gc28gcHJvcCB1cGRhdGVzIGFyZSBzdGlsbCByZWNlaXZlZCBieSB0aGUgY2hpbGRyZW4uXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZHJlbltjLmtleV0gPSBSZWFjdC5jbG9uZUVsZW1lbnQob2xkLCBjLnByb3BzLCBjLnByb3BzLmNoaWxkcmVuKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gbmV3IGVsZW1lbnQuIElmIHdlIGhhdmUgYSBzdGFydFN0eWxlLCB1c2UgdGhhdCBhcyB0aGUgc3R5bGUgYW5kIGdvIHRocm91Z2hcbiAgICAgICAgICAgICAgICAvLyB0aGUgZW50ZXIgYW5pbWF0aW9uc1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1Byb3BzID0ge307XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdGluZ1N0eWxlID0gYy5wcm9wcy5zdHlsZTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0U3R5bGVzID0gdGhpcy5wcm9wcy5zdGFydFN0eWxlcztcbiAgICAgICAgICAgICAgICBpZiAoc3RhcnRTdHlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGFydFN0eWxlID0gc3RhcnRTdHlsZXNbMF07XG4gICAgICAgICAgICAgICAgICAgIG5ld1Byb3BzLnN0eWxlID0gc3RhcnRTdHlsZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJtb3VudGVkQHN0YXJ0c3R5bGUwOiBcIitKU09OLnN0cmluZ2lmeShzdGFydFN0eWxlKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbmV3UHJvcHMucmVmID0gKChuKSA9PiB0aGlzLl9jb2xsZWN0Tm9kZShcbiAgICAgICAgICAgICAgICAgICAgYy5rZXksIG4sIHJlc3RpbmdTdHlsZSxcbiAgICAgICAgICAgICAgICApKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRyZW5bYy5rZXldID0gUmVhY3QuY2xvbmVFbGVtZW50KGMsIG5ld1Byb3BzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX2NvbGxlY3ROb2RlKGssIG5vZGUsIHJlc3RpbmdTdHlsZSkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICBub2RlICYmXG4gICAgICAgICAgICB0aGlzLm5vZGVzW2tdID09PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIHRoaXMucHJvcHMuc3RhcnRTdHlsZXMubGVuZ3RoID4gMFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0U3R5bGVzID0gdGhpcy5wcm9wcy5zdGFydFN0eWxlcztcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zaXRpb25PcHRzID0gdGhpcy5wcm9wcy5lbnRlclRyYW5zaXRpb25PcHRzO1xuICAgICAgICAgICAgY29uc3QgZG9tTm9kZSA9IFJlYWN0RG9tLmZpbmRET01Ob2RlKG5vZGUpO1xuICAgICAgICAgICAgLy8gc3RhcnQgZnJvbSBzdGFydFN0eWxlIDE6IDAgaXMgdGhlIG9uZSB3ZSBnYXZlIGl0XG4gICAgICAgICAgICAvLyB0byBzdGFydCB3aXRoLCBzbyBub3cgd2UgYW5pbWF0ZSAxIGV0Yy5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgc3RhcnRTdHlsZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBWZWxvY2l0eShkb21Ob2RlLCBzdGFydFN0eWxlc1tpXSwgdHJhbnNpdGlvbk9wdHNbaS0xXSk7XG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInN0YXJ0OlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHRyYW5zaXRpb25PcHRzW2ktMV0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiLT5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShzdGFydFN0eWxlc1tpXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBhbmQgdGhlbiB3ZSBhbmltYXRlIHRvIHRoZSByZXN0aW5nIHN0YXRlXG4gICAgICAgICAgICBWZWxvY2l0eShkb21Ob2RlLCByZXN0aW5nU3R5bGUsXG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbk9wdHNbaS0xXSlcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG9uY2Ugd2UndmUgcmVhY2hlZCB0aGUgcmVzdGluZyBzdGF0ZSwgaGlkZSB0aGUgZWxlbWVudCBpZlxuICAgICAgICAgICAgICAgICAgICAvLyBhcHByb3ByaWF0ZVxuICAgICAgICAgICAgICAgICAgICBkb21Ob2RlLnN0eWxlLnZpc2liaWxpdHkgPSByZXN0aW5nU3R5bGUudmlzaWJpbGl0eTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZW50ZXI6XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh0cmFuc2l0aW9uT3B0c1tpLTFdKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiLT5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHJlc3RpbmdTdHlsZSkpO1xuICAgICAgICAgICAgKi9cbiAgICAgICAgfSBlbHNlIGlmIChub2RlID09PSBudWxsKSB7XG4gICAgICAgICAgICAvLyBWZWxvY2l0eSBzdG9yZXMgZGF0YSBvbiBlbGVtZW50cyB1c2luZyB0aGUgalF1ZXJ5IC5kYXRhKClcbiAgICAgICAgICAgIC8vIG1ldGhvZCwgYW5kIGFzc3VtZXMgeW91J2xsIGJlIHVzaW5nIGpRdWVyeSdzIC5yZW1vdmUoKSB0b1xuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBlbGVtZW50LCBidXQgd2UgZG9uJ3QgdXNlIGpRdWVyeSwgc28gd2UgbmVlZCB0b1xuICAgICAgICAgICAgLy8gYmxvdyBhd2F5IHRoZSBlbGVtZW50J3MgZGF0YSBleHBsaWNpdGx5IG90aGVyd2lzZSBpdCB3aWxsIGxlYWsuXG4gICAgICAgICAgICAvLyBUaGlzIHVzZXMgVmVsb2NpdHkncyBpbnRlcm5hbCBqUXVlcnkgY29tcGF0aWJsZSB3cmFwcGVyLlxuICAgICAgICAgICAgLy8gU2VlIHRoZSBidWcgYXRcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9qdWxpYW5zaGFwaXJvL3ZlbG9jaXR5L2lzc3Vlcy8zMDBcbiAgICAgICAgICAgIC8vIGFuZCB0aGUgRkFRIGVudHJ5LCBcIlByZXZlbnRpbmcgbWVtb3J5IGxlYWtzIHdoZW5cbiAgICAgICAgICAgIC8vIGNyZWF0aW5nL2Rlc3Ryb3lpbmcgbGFyZ2UgbnVtYmVycyBvZiBlbGVtZW50c1wiXG4gICAgICAgICAgICAvLyAoaHR0cHM6Ly9naXRodWIuY29tL2p1bGlhbnNoYXBpcm8vdmVsb2NpdHkvaXNzdWVzLzQ3KVxuICAgICAgICAgICAgY29uc3QgZG9tTm9kZSA9IFJlYWN0RG9tLmZpbmRET01Ob2RlKHRoaXMubm9kZXNba10pO1xuICAgICAgICAgICAgaWYgKGRvbU5vZGUpIFZlbG9jaXR5LlV0aWxpdGllcy5yZW1vdmVEYXRhKGRvbU5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubm9kZXNba10gPSBub2RlO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgIHsgT2JqZWN0LnZhbHVlcyh0aGlzLmNoaWxkcmVuKSB9XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19