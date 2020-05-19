'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _getDraggablesInsideDroppable = require('../get-draggables-inside-droppable');

var _getDraggablesInsideDroppable2 = _interopRequireDefault(_getDraggablesInsideDroppable);

var _position = require('../position');

var _moveToEdge = require('../move-to-edge');

var _moveToEdge2 = _interopRequireDefault(_moveToEdge);

var _getDisplacement = require('../get-displacement');

var _getDisplacement2 = _interopRequireDefault(_getDisplacement);

var _getViewport = require('../visibility/get-viewport');

var _getViewport2 = _interopRequireDefault(_getViewport);

var _isVisibleInNewLocation = require('./is-visible-in-new-location');

var _isVisibleInNewLocation2 = _interopRequireDefault(_isVisibleInNewLocation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (_ref) {
  var isMovingForward = _ref.isMovingForward,
      draggableId = _ref.draggableId,
      previousImpact = _ref.previousImpact,
      droppable = _ref.droppable,
      draggables = _ref.draggables;

  if (!previousImpact.destination) {
    console.error('cannot move to next index when there is not previous destination');
    return null;
  }

  var location = previousImpact.destination;
  var draggable = draggables[draggableId];
  var axis = droppable.axis;

  var insideForeignDroppable = (0, _getDraggablesInsideDroppable2.default)(droppable, draggables);

  var currentIndex = location.index;
  var proposedIndex = isMovingForward ? currentIndex + 1 : currentIndex - 1;
  var lastIndex = insideForeignDroppable.length - 1;

  if (proposedIndex > insideForeignDroppable.length) {
    return null;
  }

  if (proposedIndex < 0) {
    return null;
  }

  var movingRelativeTo = insideForeignDroppable[Math.min(proposedIndex, lastIndex)];

  var isMovingPastLastIndex = proposedIndex > lastIndex;
  var sourceEdge = 'start';
  var destinationEdge = function () {
    if (isMovingPastLastIndex) {
      return 'end';
    }

    return 'start';
  }();

  var viewport = (0, _getViewport2.default)();
  var newCenter = (0, _moveToEdge2.default)({
    source: draggable.page.withoutMargin,
    sourceEdge: sourceEdge,
    destination: movingRelativeTo.page.withMargin,
    destinationEdge: destinationEdge,
    destinationAxis: droppable.axis
  });

  var isVisible = function () {
    if (isMovingPastLastIndex) {
      return true;
    }

    return (0, _isVisibleInNewLocation2.default)({
      draggable: draggable,
      destination: droppable,
      newCenter: newCenter,
      viewport: viewport
    });
  }();

  if (!isVisible) {
    return null;
  }

  var movingRelativeToDisplacement = {
    draggableId: movingRelativeTo.descriptor.id,
    isVisible: true,
    shouldAnimate: true
  };

  var modified = isMovingForward ? previousImpact.movement.displaced.slice(1, previousImpact.movement.displaced.length) : [movingRelativeToDisplacement].concat((0, _toConsumableArray3.default)(previousImpact.movement.displaced));

  var displaced = modified.map(function (displacement) {
    if (displacement === movingRelativeToDisplacement) {
      return displacement;
    }

    var target = draggables[displacement.draggableId];

    var updated = (0, _getDisplacement2.default)({
      draggable: target,
      destination: droppable,
      viewport: viewport,
      previousImpact: previousImpact
    });

    return updated;
  });

  var newImpact = {
    movement: {
      displaced: displaced,

      amount: (0, _position.patch)(axis.line, draggable.page.withMargin[axis.size]),

      isBeyondStartPosition: false
    },
    destination: {
      droppableId: droppable.descriptor.id,
      index: proposedIndex
    },
    direction: droppable.axis.direction
  };

  return {
    pageCenter: newCenter,
    impact: newImpact
  };
};