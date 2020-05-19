'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var interactiveTagNames = exports.interactiveTagNames = ['input', 'button', 'textarea', 'select', 'option', 'optgroup', 'video', 'audio'];

var isContentEditable = function isContentEditable(parent, current) {
  if (current == null) {
    return false;
  }

  var attribute = current.getAttribute('contenteditable');
  if (attribute === 'true' || attribute === '') {
    return true;
  }

  if (current === parent) {
    return false;
  }

  return isContentEditable(parent, current.parentElement);
};

exports.default = function (event, props) {
  if (props.canDragInteractiveElements) {
    return true;
  }

  var target = event.target,
      currentTarget = event.currentTarget;

  if (!(target instanceof HTMLElement) || !(currentTarget instanceof HTMLElement)) {
    return true;
  }

  var isTargetInteractive = interactiveTagNames.indexOf(target.tagName.toLowerCase()) !== -1;

  if (isTargetInteractive) {
    return false;
  }

  return !isContentEditable(currentTarget, target);
};