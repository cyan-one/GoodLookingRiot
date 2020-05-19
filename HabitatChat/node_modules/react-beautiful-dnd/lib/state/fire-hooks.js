'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (hooks, previous, current) {
  var onDragStart = hooks.onDragStart,
      onDragEnd = hooks.onDragEnd;

  var currentPhase = current.phase;
  var previousPhase = previous.phase;

  if (currentPhase === previousPhase) {
    return;
  }

  if (currentPhase === 'DRAGGING' && previousPhase !== 'DRAGGING') {
    if (!onDragStart) {
      return;
    }

    if (!current.drag) {
      console.error('cannot fire onDragStart hook without drag state', { current: current, previous: previous });
      return;
    }

    var descriptor = current.drag.initial.descriptor;
    var home = current.dimension.droppable[descriptor.droppableId];

    if (!home) {
      console.error('cannot find dimension for home droppable');
      return;
    }

    var source = {
      index: descriptor.index,
      droppableId: descriptor.droppableId
    };

    var start = {
      draggableId: descriptor.id,
      type: home.descriptor.type,
      source: source
    };

    onDragStart(start);
    return;
  }

  if (currentPhase === 'DROP_COMPLETE' && previousPhase !== 'DROP_COMPLETE') {
    if (!current.drop || !current.drop.result) {
      console.error('cannot fire onDragEnd hook without drag state', { current: current, previous: previous });
      return;
    }

    var _current$drop$result = current.drop.result,
        _source = _current$drop$result.source,
        destination = _current$drop$result.destination,
        draggableId = _current$drop$result.draggableId,
        type = _current$drop$result.type;

    if (!destination) {
      onDragEnd(current.drop.result);
      return;
    }

    var didMove = _source.droppableId !== destination.droppableId || _source.index !== destination.index;

    if (didMove) {
      onDragEnd(current.drop.result);
      return;
    }

    var muted = {
      draggableId: draggableId,
      type: type,
      source: _source,
      destination: null
    };

    onDragEnd(muted);
    return;
  }

  if (currentPhase === 'IDLE' && previousPhase === 'DRAGGING') {
    if (!previous.drag) {
      console.error('cannot fire onDragEnd for cancel because cannot find previous drag');
      return;
    }

    var _descriptor = previous.drag.initial.descriptor;
    var _home = previous.dimension.droppable[_descriptor.droppableId];

    if (!_home) {
      console.error('cannot find dimension for home droppable');
      return;
    }

    var _source2 = {
      index: _descriptor.index,
      droppableId: _descriptor.droppableId
    };

    var result = {
      draggableId: _descriptor.id,
      type: _home.descriptor.type,
      source: _source2,
      destination: null
    };
    onDragEnd(result);
    return;
  }

  if (currentPhase === 'IDLE' && previousPhase === 'DROP_ANIMATING') {
    if (!previous.drop || !previous.drop.pending) {
      console.error('cannot fire onDragEnd for cancel because cannot find previous pending drop');
      return;
    }

    var _result = {
      draggableId: previous.drop.pending.result.draggableId,
      type: previous.drop.pending.result.type,
      source: previous.drop.pending.result.source,
      destination: null
    };
    onDragEnd(_result);
  }
};