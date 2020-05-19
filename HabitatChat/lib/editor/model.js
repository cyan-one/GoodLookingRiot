"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _diff = require("./diff");

var _position = _interopRequireDefault(require("./position"));

var _range = _interopRequireDefault(require("./range"));

/*
Copyright 2019 New Vector Ltd
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

/**
 * @callback ModelCallback
 * @param {DocumentPosition?} caretPosition the position where the caret should be position
 * @param {string?} inputType the inputType of the DOM input event
 * @param {object?} diff an object with `removed` and `added` strings
 */

/**
* @callback TransformCallback
* @param {DocumentPosition?} caretPosition the position where the caret should be position
* @param {string?} inputType the inputType of the DOM input event
* @param {object?} diff an object with `removed` and `added` strings
* @return {Number?} addedLen how many characters were added/removed (-) before the caret during the transformation step.
*    This is used to adjust the caret position.
*/

/**
 * @callback ManualTransformCallback
 * @return the caret position
 */
class EditorModel {
  constructor(parts, partCreator, updateCallback = null) {
    (0, _defineProperty2.default)(this, "_onAutoComplete", ({
      replaceParts,
      close
    }) => {
      let pos;

      if (replaceParts) {
        this._parts.splice(this._autoCompletePartIdx, this._autoCompletePartCount, ...replaceParts);

        this._autoCompletePartCount = replaceParts.length;
        const lastPart = replaceParts[replaceParts.length - 1];
        const lastPartIndex = this._autoCompletePartIdx + replaceParts.length - 1;
        pos = new _position.default(lastPartIndex, lastPart.text.length);
      }

      if (close) {
        this._autoComplete = null;
        this._autoCompletePartIdx = null;
        this._autoCompletePartCount = 0;
      } // rerender even if editor contents didn't change
      // to make sure the MessageEditor checks
      // model.autoComplete being empty and closes it


      this._updateCallback(pos);
    });
    this._parts = parts;
    this._partCreator = partCreator;
    this._activePartIdx = null;
    this._autoComplete = null;
    this._autoCompletePartIdx = null;
    this._autoCompletePartCount = 0;
    this._transformCallback = null;
    this.setUpdateCallback(updateCallback);
  }
  /**
   * Set a callback for the transformation step.
   * While processing an update, right before calling the update callback,
   * a transform callback can be called, which serves to do modifications
   * on the model that can span multiple parts. Also see `startRange()`.
   * @param {TransformCallback} transformCallback
   */


  setTransformCallback(transformCallback) {
    this._transformCallback = transformCallback;
  }
  /**
   * Set a callback for rerendering the model after it has been updated.
   * @param {ModelCallback} updateCallback
   */


  setUpdateCallback(updateCallback) {
    this._updateCallback = updateCallback;
  }

  get partCreator() {
    return this._partCreator;
  }

  get isEmpty() {
    return this._parts.reduce((len, part) => len + part.text.length, 0) === 0;
  }

  clone() {
    return new EditorModel(this._parts, this._partCreator, this._updateCallback);
  }

  _insertPart(index, part) {
    this._parts.splice(index, 0, part);

    if (this._activePartIdx >= index) {
      ++this._activePartIdx;
    }

    if (this._autoCompletePartIdx >= index) {
      ++this._autoCompletePartIdx;
    }
  }

  _removePart(index) {
    this._parts.splice(index, 1);

    if (index === this._activePartIdx) {
      this._activePartIdx = null;
    } else if (this._activePartIdx > index) {
      --this._activePartIdx;
    }

    if (index === this._autoCompletePartIdx) {
      this._autoCompletePartIdx = null;
    } else if (this._autoCompletePartIdx > index) {
      --this._autoCompletePartIdx;
    }
  }

  _replacePart(index, part) {
    this._parts.splice(index, 1, part);
  }

  get parts() {
    return this._parts;
  }

  get autoComplete() {
    if (this._activePartIdx === this._autoCompletePartIdx) {
      return this._autoComplete;
    }

    return null;
  }

  getPositionAtEnd() {
    if (this._parts.length) {
      const index = this._parts.length - 1;
      const part = this._parts[index];
      return new _position.default(index, part.text.length);
    } else {
      // part index -1, as there are no parts to point at
      return new _position.default(-1, 0);
    }
  }

  serializeParts() {
    return this._parts.map(p => p.serialize());
  }

  _diff(newValue, inputType, caret) {
    const previousValue = this.parts.reduce((text, p) => text + p.text, ""); // can't use caret position with drag and drop

    if (inputType === "deleteByDrag") {
      return (0, _diff.diffDeletion)(previousValue, newValue);
    } else {
      return (0, _diff.diffAtCaret)(previousValue, newValue, caret.offset);
    }
  }

  reset(serializedParts, caret, inputType) {
    this._parts = serializedParts.map(p => this._partCreator.deserializePart(p));

    if (!caret) {
      caret = this.getPositionAtEnd();
    } // close auto complete if open
    // this would happen when clearing the composer after sending
    // a message with the autocomplete still open


    if (this._autoComplete) {
      this._autoComplete = null;
      this._autoCompletePartIdx = null;
    }

    this._updateCallback(caret, inputType);
  }
  /**
   * Inserts the given parts at the given position.
   * Should be run inside a `model.transform()` callback.
   * @param {Part[]} parts the parts to replace the range with
   * @param {DocumentPosition} position the position to start inserting at
   * @return {Number} the amount of characters added
   */


  insert(parts, position) {
    const insertIndex = this._splitAt(position);

    let newTextLength = 0;

    for (let i = 0; i < parts.length; ++i) {
      const part = parts[i];
      newTextLength += part.text.length;

      this._insertPart(insertIndex + i, part);
    }

    return newTextLength;
  }

  update(newValue, inputType, caret) {
    const diff = this._diff(newValue, inputType, caret);

    const position = this.positionForOffset(diff.at, caret.atNodeEnd);
    let removedOffsetDecrease = 0;

    if (diff.removed) {
      removedOffsetDecrease = this.removeText(position, diff.removed.length);
    }

    let addedLen = 0;

    if (diff.added) {
      addedLen = this._addText(position, diff.added, inputType);
    }

    this._mergeAdjacentParts();

    const caretOffset = diff.at - removedOffsetDecrease + addedLen;
    let newPosition = this.positionForOffset(caretOffset, true);
    const canOpenAutoComplete = inputType !== "insertFromPaste" && inputType !== "insertFromDrop";

    const acPromise = this._setActivePart(newPosition, canOpenAutoComplete);

    if (this._transformCallback) {
      const transformAddedLen = this._transform(newPosition, inputType, diff);

      newPosition = this.positionForOffset(caretOffset + transformAddedLen, true);
    }

    this._updateCallback(newPosition, inputType, diff);

    return acPromise;
  }

  _transform(newPosition, inputType, diff) {
    const result = this._transformCallback(newPosition, inputType, diff);

    return Number.isFinite(result) ? result : 0;
  }

  _setActivePart(pos, canOpenAutoComplete) {
    const {
      index
    } = pos;
    const part = this._parts[index];

    if (part) {
      if (index !== this._activePartIdx) {
        this._activePartIdx = index;

        if (canOpenAutoComplete && this._activePartIdx !== this._autoCompletePartIdx) {
          // else try to create one
          const ac = part.createAutoComplete(this._onAutoComplete);

          if (ac) {
            // make sure that react picks up the difference between both acs
            this._autoComplete = ac;
            this._autoCompletePartIdx = index;
            this._autoCompletePartCount = 1;
          }
        }
      } // not _autoComplete, only there if active part is autocomplete part


      if (this.autoComplete) {
        return this.autoComplete.onPartUpdate(part, pos);
      }
    } else {
      this._activePartIdx = null;
      this._autoComplete = null;
      this._autoCompletePartIdx = null;
      this._autoCompletePartCount = 0;
    }

    return Promise.resolve();
  }

  _mergeAdjacentParts() {
    let prevPart;

    for (let i = 0; i < this._parts.length; ++i) {
      let part = this._parts[i];
      const isEmpty = !part.text.length;
      const isMerged = !isEmpty && prevPart && prevPart.merge(part);

      if (isEmpty || isMerged) {
        // remove empty or merged part
        part = prevPart;

        this._removePart(i); //repeat this index, as it's removed now


        --i;
      }

      prevPart = part;
    }
  }
  /**
   * removes `len` amount of characters at `pos`.
   * @param {Object} pos
   * @param {Number} len
   * @return {Number} how many characters before pos were also removed,
   * usually because of non-editable parts that can only be removed in their entirety.
   */


  removeText(pos, len) {
    let {
      index,
      offset
    } = pos;
    let removedOffsetDecrease = 0;

    while (len > 0) {
      // part might be undefined here
      let part = this._parts[index];
      const amount = Math.min(len, part.text.length - offset); // don't allow 0 amount deletions

      if (amount) {
        if (part.canEdit) {
          const replaceWith = part.remove(offset, amount);

          if (typeof replaceWith === "string") {
            this._replacePart(index, this._partCreator.createDefaultPart(replaceWith));
          }

          part = this._parts[index]; // remove empty part

          if (!part.text.length) {
            this._removePart(index);
          } else {
            index += 1;
          }
        } else {
          removedOffsetDecrease += offset;

          this._removePart(index);
        }
      } else {
        index += 1;
      }

      len -= amount;
      offset = 0;
    }

    return removedOffsetDecrease;
  } // return part index where insertion will insert between at offset


  _splitAt(pos) {
    if (pos.index === -1) {
      return 0;
    }

    if (pos.offset === 0) {
      return pos.index;
    }

    const part = this._parts[pos.index];

    if (pos.offset >= part.text.length) {
      return pos.index + 1;
    }

    const secondPart = part.split(pos.offset);

    this._insertPart(pos.index + 1, secondPart);

    return pos.index + 1;
  }
  /**
   * inserts `str` into the model at `pos`.
   * @param {Object} pos
   * @param {string} str
   * @param {string} inputType the source of the input, see html InputEvent.inputType
   * @param {bool} options.validate Whether characters will be validated by the part.
   *                                Validating allows the inserted text to be parsed according to the part rules.
   * @return {Number} how far from position (in characters) the insertion ended.
   * This can be more than the length of `str` when crossing non-editable parts, which are skipped.
   */


  _addText(pos, str, inputType) {
    let {
      index
    } = pos;
    const {
      offset
    } = pos;
    let addLen = str.length;
    const part = this._parts[index];

    if (part) {
      if (part.canEdit) {
        if (part.validateAndInsert(offset, str, inputType)) {
          str = null;
        } else {
          const splitPart = part.split(offset);
          index += 1;

          this._insertPart(index, splitPart);
        }
      } else if (offset !== 0) {
        // not-editable part, caret is not at start,
        // so insert str after this part
        addLen += part.text.length - offset;
        index += 1;
      }
    } else if (index < 0) {
      // if position was not found (index: -1, as happens for empty editor)
      // reset it to insert as first part
      index = 0;
    }

    while (str) {
      const newPart = this._partCreator.createPartForInput(str, index, inputType);

      str = newPart.appendUntilRejected(str, inputType);

      this._insertPart(index, newPart);

      index += 1;
    }

    return addLen;
  }

  positionForOffset(totalOffset, atPartEnd) {
    let currentOffset = 0;

    const index = this._parts.findIndex(part => {
      const partLen = part.text.length;

      if (atPartEnd && currentOffset + partLen >= totalOffset || !atPartEnd && currentOffset + partLen > totalOffset) {
        return true;
      }

      currentOffset += partLen;
      return false;
    });

    if (index === -1) {
      return this.getPositionAtEnd();
    } else {
      return new _position.default(index, totalOffset - currentOffset);
    }
  }
  /**
   * Starts a range, which can span across multiple parts, to find and replace text.
   * @param {DocumentPosition} positionA a boundary of the range
   * @param {DocumentPosition?} positionB the other boundary of the range, optional
   * @return {Range}
   */


  startRange(positionA, positionB = positionA) {
    return new _range.default(this, positionA, positionB);
  } // called from Range.replace


  _replaceRange(startPosition, endPosition, parts) {
    // convert end position to offset, so it is independent of how the document is split into parts
    // which we'll change when splitting up at the start position
    const endOffset = endPosition.asOffset(this);

    const newStartPartIndex = this._splitAt(startPosition); // convert it back to position once split at start


    endPosition = endOffset.asPosition(this);

    const newEndPartIndex = this._splitAt(endPosition);

    for (let i = newEndPartIndex - 1; i >= newStartPartIndex; --i) {
      this._removePart(i);
    }

    let insertIdx = newStartPartIndex;

    for (const part of parts) {
      this._insertPart(insertIdx, part);

      insertIdx += 1;
    }

    this._mergeAdjacentParts();
  }
  /**
   * Performs a transformation not part of an update cycle.
   * Modifying the model should only happen inside a transform call if not part of an update call.
   * @param {ManualTransformCallback} callback to run the transformations in
   * @return {Promise} a promise when auto-complete (if applicable) is done updating
   */


  transform(callback) {
    const pos = callback();
    let acPromise = null;

    if (!(pos instanceof _range.default)) {
      acPromise = this._setActivePart(pos, true);
    } else {
      acPromise = Promise.resolve();
    }

    this._updateCallback(pos);

    return acPromise;
  }

}

exports.default = EditorModel;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9lZGl0b3IvbW9kZWwuanMiXSwibmFtZXMiOlsiRWRpdG9yTW9kZWwiLCJjb25zdHJ1Y3RvciIsInBhcnRzIiwicGFydENyZWF0b3IiLCJ1cGRhdGVDYWxsYmFjayIsInJlcGxhY2VQYXJ0cyIsImNsb3NlIiwicG9zIiwiX3BhcnRzIiwic3BsaWNlIiwiX2F1dG9Db21wbGV0ZVBhcnRJZHgiLCJfYXV0b0NvbXBsZXRlUGFydENvdW50IiwibGVuZ3RoIiwibGFzdFBhcnQiLCJsYXN0UGFydEluZGV4IiwiRG9jdW1lbnRQb3NpdGlvbiIsInRleHQiLCJfYXV0b0NvbXBsZXRlIiwiX3VwZGF0ZUNhbGxiYWNrIiwiX3BhcnRDcmVhdG9yIiwiX2FjdGl2ZVBhcnRJZHgiLCJfdHJhbnNmb3JtQ2FsbGJhY2siLCJzZXRVcGRhdGVDYWxsYmFjayIsInNldFRyYW5zZm9ybUNhbGxiYWNrIiwidHJhbnNmb3JtQ2FsbGJhY2siLCJpc0VtcHR5IiwicmVkdWNlIiwibGVuIiwicGFydCIsImNsb25lIiwiX2luc2VydFBhcnQiLCJpbmRleCIsIl9yZW1vdmVQYXJ0IiwiX3JlcGxhY2VQYXJ0IiwiYXV0b0NvbXBsZXRlIiwiZ2V0UG9zaXRpb25BdEVuZCIsInNlcmlhbGl6ZVBhcnRzIiwibWFwIiwicCIsInNlcmlhbGl6ZSIsIl9kaWZmIiwibmV3VmFsdWUiLCJpbnB1dFR5cGUiLCJjYXJldCIsInByZXZpb3VzVmFsdWUiLCJvZmZzZXQiLCJyZXNldCIsInNlcmlhbGl6ZWRQYXJ0cyIsImRlc2VyaWFsaXplUGFydCIsImluc2VydCIsInBvc2l0aW9uIiwiaW5zZXJ0SW5kZXgiLCJfc3BsaXRBdCIsIm5ld1RleHRMZW5ndGgiLCJpIiwidXBkYXRlIiwiZGlmZiIsInBvc2l0aW9uRm9yT2Zmc2V0IiwiYXQiLCJhdE5vZGVFbmQiLCJyZW1vdmVkT2Zmc2V0RGVjcmVhc2UiLCJyZW1vdmVkIiwicmVtb3ZlVGV4dCIsImFkZGVkTGVuIiwiYWRkZWQiLCJfYWRkVGV4dCIsIl9tZXJnZUFkamFjZW50UGFydHMiLCJjYXJldE9mZnNldCIsIm5ld1Bvc2l0aW9uIiwiY2FuT3BlbkF1dG9Db21wbGV0ZSIsImFjUHJvbWlzZSIsIl9zZXRBY3RpdmVQYXJ0IiwidHJhbnNmb3JtQWRkZWRMZW4iLCJfdHJhbnNmb3JtIiwicmVzdWx0IiwiTnVtYmVyIiwiaXNGaW5pdGUiLCJhYyIsImNyZWF0ZUF1dG9Db21wbGV0ZSIsIl9vbkF1dG9Db21wbGV0ZSIsIm9uUGFydFVwZGF0ZSIsIlByb21pc2UiLCJyZXNvbHZlIiwicHJldlBhcnQiLCJpc01lcmdlZCIsIm1lcmdlIiwiYW1vdW50IiwiTWF0aCIsIm1pbiIsImNhbkVkaXQiLCJyZXBsYWNlV2l0aCIsInJlbW92ZSIsImNyZWF0ZURlZmF1bHRQYXJ0Iiwic2Vjb25kUGFydCIsInNwbGl0Iiwic3RyIiwiYWRkTGVuIiwidmFsaWRhdGVBbmRJbnNlcnQiLCJzcGxpdFBhcnQiLCJuZXdQYXJ0IiwiY3JlYXRlUGFydEZvcklucHV0IiwiYXBwZW5kVW50aWxSZWplY3RlZCIsInRvdGFsT2Zmc2V0IiwiYXRQYXJ0RW5kIiwiY3VycmVudE9mZnNldCIsImZpbmRJbmRleCIsInBhcnRMZW4iLCJzdGFydFJhbmdlIiwicG9zaXRpb25BIiwicG9zaXRpb25CIiwiUmFuZ2UiLCJfcmVwbGFjZVJhbmdlIiwic3RhcnRQb3NpdGlvbiIsImVuZFBvc2l0aW9uIiwiZW5kT2Zmc2V0IiwiYXNPZmZzZXQiLCJuZXdTdGFydFBhcnRJbmRleCIsImFzUG9zaXRpb24iLCJuZXdFbmRQYXJ0SW5kZXgiLCJpbnNlcnRJZHgiLCJ0cmFuc2Zvcm0iLCJjYWxsYmFjayJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBbkJBOzs7Ozs7Ozs7Ozs7Ozs7OztBQXFCQTs7Ozs7OztBQU9DOzs7Ozs7Ozs7QUFTRDs7OztBQUtlLE1BQU1BLFdBQU4sQ0FBa0I7QUFDN0JDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFRQyxXQUFSLEVBQXFC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LE1BRU87QUFDSCtELE1BQUFBLFNBQVMsR0FBR1csT0FBTyxDQUFDQyxPQUFSLEVBQVo7QUFDSDs7QUFDRCxTQUFLaEUsZUFBTCxDQUFxQlgsR0FBckI7O0FBQ0EsV0FBTytELFNBQVA7QUFDSDs7QUFwWjRCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCB7ZGlmZkF0Q2FyZXQsIGRpZmZEZWxldGlvbn0gZnJvbSBcIi4vZGlmZlwiO1xuaW1wb3J0IERvY3VtZW50UG9zaXRpb24gZnJvbSBcIi4vcG9zaXRpb25cIjtcbmltcG9ydCBSYW5nZSBmcm9tIFwiLi9yYW5nZVwiO1xuXG4vKipcbiAqIEBjYWxsYmFjayBNb2RlbENhbGxiYWNrXG4gKiBAcGFyYW0ge0RvY3VtZW50UG9zaXRpb24/fSBjYXJldFBvc2l0aW9uIHRoZSBwb3NpdGlvbiB3aGVyZSB0aGUgY2FyZXQgc2hvdWxkIGJlIHBvc2l0aW9uXG4gKiBAcGFyYW0ge3N0cmluZz99IGlucHV0VHlwZSB0aGUgaW5wdXRUeXBlIG9mIHRoZSBET00gaW5wdXQgZXZlbnRcbiAqIEBwYXJhbSB7b2JqZWN0P30gZGlmZiBhbiBvYmplY3Qgd2l0aCBgcmVtb3ZlZGAgYW5kIGBhZGRlZGAgc3RyaW5nc1xuICovXG5cbiAvKipcbiAqIEBjYWxsYmFjayBUcmFuc2Zvcm1DYWxsYmFja1xuICogQHBhcmFtIHtEb2N1bWVudFBvc2l0aW9uP30gY2FyZXRQb3NpdGlvbiB0aGUgcG9zaXRpb24gd2hlcmUgdGhlIGNhcmV0IHNob3VsZCBiZSBwb3NpdGlvblxuICogQHBhcmFtIHtzdHJpbmc/fSBpbnB1dFR5cGUgdGhlIGlucHV0VHlwZSBvZiB0aGUgRE9NIGlucHV0IGV2ZW50XG4gKiBAcGFyYW0ge29iamVjdD99IGRpZmYgYW4gb2JqZWN0IHdpdGggYHJlbW92ZWRgIGFuZCBgYWRkZWRgIHN0cmluZ3NcbiAqIEByZXR1cm4ge051bWJlcj99IGFkZGVkTGVuIGhvdyBtYW55IGNoYXJhY3RlcnMgd2VyZSBhZGRlZC9yZW1vdmVkICgtKSBiZWZvcmUgdGhlIGNhcmV0IGR1cmluZyB0aGUgdHJhbnNmb3JtYXRpb24gc3RlcC5cbiAqICAgIFRoaXMgaXMgdXNlZCB0byBhZGp1c3QgdGhlIGNhcmV0IHBvc2l0aW9uLlxuICovXG5cbi8qKlxuICogQGNhbGxiYWNrIE1hbnVhbFRyYW5zZm9ybUNhbGxiYWNrXG4gKiBAcmV0dXJuIHRoZSBjYXJldCBwb3NpdGlvblxuICovXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVkaXRvck1vZGVsIHtcbiAgICBjb25zdHJ1Y3RvcihwYXJ0cywgcGFydENyZWF0b3IsIHVwZGF0ZUNhbGxiYWNrID0gbnVsbCkge1xuICAgICAgICB0aGlzLl9wYXJ0cyA9IHBhcnRzO1xuICAgICAgICB0aGlzLl9wYXJ0Q3JlYXRvciA9IHBhcnRDcmVhdG9yO1xuICAgICAgICB0aGlzLl9hY3RpdmVQYXJ0SWR4ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fYXV0b0NvbXBsZXRlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fYXV0b0NvbXBsZXRlUGFydElkeCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2F1dG9Db21wbGV0ZVBhcnRDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuX3RyYW5zZm9ybUNhbGxiYWNrID0gbnVsbDtcbiAgICAgICAgdGhpcy5zZXRVcGRhdGVDYWxsYmFjayh1cGRhdGVDYWxsYmFjayk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IGEgY2FsbGJhY2sgZm9yIHRoZSB0cmFuc2Zvcm1hdGlvbiBzdGVwLlxuICAgICAqIFdoaWxlIHByb2Nlc3NpbmcgYW4gdXBkYXRlLCByaWdodCBiZWZvcmUgY2FsbGluZyB0aGUgdXBkYXRlIGNhbGxiYWNrLFxuICAgICAqIGEgdHJhbnNmb3JtIGNhbGxiYWNrIGNhbiBiZSBjYWxsZWQsIHdoaWNoIHNlcnZlcyB0byBkbyBtb2RpZmljYXRpb25zXG4gICAgICogb24gdGhlIG1vZGVsIHRoYXQgY2FuIHNwYW4gbXVsdGlwbGUgcGFydHMuIEFsc28gc2VlIGBzdGFydFJhbmdlKClgLlxuICAgICAqIEBwYXJhbSB7VHJhbnNmb3JtQ2FsbGJhY2t9IHRyYW5zZm9ybUNhbGxiYWNrXG4gICAgICovXG4gICAgc2V0VHJhbnNmb3JtQ2FsbGJhY2sodHJhbnNmb3JtQ2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5fdHJhbnNmb3JtQ2FsbGJhY2sgPSB0cmFuc2Zvcm1DYWxsYmFjaztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgYSBjYWxsYmFjayBmb3IgcmVyZW5kZXJpbmcgdGhlIG1vZGVsIGFmdGVyIGl0IGhhcyBiZWVuIHVwZGF0ZWQuXG4gICAgICogQHBhcmFtIHtNb2RlbENhbGxiYWNrfSB1cGRhdGVDYWxsYmFja1xuICAgICAqL1xuICAgIHNldFVwZGF0ZUNhbGxiYWNrKHVwZGF0ZUNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNhbGxiYWNrID0gdXBkYXRlQ2FsbGJhY2s7XG4gICAgfVxuXG4gICAgZ2V0IHBhcnRDcmVhdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFydENyZWF0b3I7XG4gICAgfVxuXG4gICAgZ2V0IGlzRW1wdHkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJ0cy5yZWR1Y2UoKGxlbiwgcGFydCkgPT4gbGVuICsgcGFydC50ZXh0Lmxlbmd0aCwgMCkgPT09IDA7XG4gICAgfVxuXG4gICAgY2xvbmUoKSB7XG4gICAgICAgIHJldHVybiBuZXcgRWRpdG9yTW9kZWwodGhpcy5fcGFydHMsIHRoaXMuX3BhcnRDcmVhdG9yLCB0aGlzLl91cGRhdGVDYWxsYmFjayk7XG4gICAgfVxuXG4gICAgX2luc2VydFBhcnQoaW5kZXgsIHBhcnQpIHtcbiAgICAgICAgdGhpcy5fcGFydHMuc3BsaWNlKGluZGV4LCAwLCBwYXJ0KTtcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZVBhcnRJZHggPj0gaW5kZXgpIHtcbiAgICAgICAgICAgICsrdGhpcy5fYWN0aXZlUGFydElkeDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fYXV0b0NvbXBsZXRlUGFydElkeCA+PSBpbmRleCkge1xuICAgICAgICAgICAgKyt0aGlzLl9hdXRvQ29tcGxldGVQYXJ0SWR4O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3JlbW92ZVBhcnQoaW5kZXgpIHtcbiAgICAgICAgdGhpcy5fcGFydHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgaWYgKGluZGV4ID09PSB0aGlzLl9hY3RpdmVQYXJ0SWR4KSB7XG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVQYXJ0SWR4ID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9hY3RpdmVQYXJ0SWR4ID4gaW5kZXgpIHtcbiAgICAgICAgICAgIC0tdGhpcy5fYWN0aXZlUGFydElkeDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5kZXggPT09IHRoaXMuX2F1dG9Db21wbGV0ZVBhcnRJZHgpIHtcbiAgICAgICAgICAgIHRoaXMuX2F1dG9Db21wbGV0ZVBhcnRJZHggPSBudWxsO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2F1dG9Db21wbGV0ZVBhcnRJZHggPiBpbmRleCkge1xuICAgICAgICAgICAgLS10aGlzLl9hdXRvQ29tcGxldGVQYXJ0SWR4O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3JlcGxhY2VQYXJ0KGluZGV4LCBwYXJ0KSB7XG4gICAgICAgIHRoaXMuX3BhcnRzLnNwbGljZShpbmRleCwgMSwgcGFydCk7XG4gICAgfVxuXG4gICAgZ2V0IHBhcnRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFydHM7XG4gICAgfVxuXG4gICAgZ2V0IGF1dG9Db21wbGV0ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZVBhcnRJZHggPT09IHRoaXMuX2F1dG9Db21wbGV0ZVBhcnRJZHgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hdXRvQ29tcGxldGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZ2V0UG9zaXRpb25BdEVuZCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3BhcnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLl9wYXJ0cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgY29uc3QgcGFydCA9IHRoaXMuX3BhcnRzW2luZGV4XTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRG9jdW1lbnRQb3NpdGlvbihpbmRleCwgcGFydC50ZXh0Lmxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBwYXJ0IGluZGV4IC0xLCBhcyB0aGVyZSBhcmUgbm8gcGFydHMgdG8gcG9pbnQgYXRcbiAgICAgICAgICAgIHJldHVybiBuZXcgRG9jdW1lbnRQb3NpdGlvbigtMSwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXJpYWxpemVQYXJ0cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcnRzLm1hcChwID0+IHAuc2VyaWFsaXplKCkpO1xuICAgIH1cblxuICAgIF9kaWZmKG5ld1ZhbHVlLCBpbnB1dFR5cGUsIGNhcmV0KSB7XG4gICAgICAgIGNvbnN0IHByZXZpb3VzVmFsdWUgPSB0aGlzLnBhcnRzLnJlZHVjZSgodGV4dCwgcCkgPT4gdGV4dCArIHAudGV4dCwgXCJcIik7XG4gICAgICAgIC8vIGNhbid0IHVzZSBjYXJldCBwb3NpdGlvbiB3aXRoIGRyYWcgYW5kIGRyb3BcbiAgICAgICAgaWYgKGlucHV0VHlwZSA9PT0gXCJkZWxldGVCeURyYWdcIikge1xuICAgICAgICAgICAgcmV0dXJuIGRpZmZEZWxldGlvbihwcmV2aW91c1ZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZGlmZkF0Q2FyZXQocHJldmlvdXNWYWx1ZSwgbmV3VmFsdWUsIGNhcmV0Lm9mZnNldCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXNldChzZXJpYWxpemVkUGFydHMsIGNhcmV0LCBpbnB1dFR5cGUpIHtcbiAgICAgICAgdGhpcy5fcGFydHMgPSBzZXJpYWxpemVkUGFydHMubWFwKHAgPT4gdGhpcy5fcGFydENyZWF0b3IuZGVzZXJpYWxpemVQYXJ0KHApKTtcbiAgICAgICAgaWYgKCFjYXJldCkge1xuICAgICAgICAgICAgY2FyZXQgPSB0aGlzLmdldFBvc2l0aW9uQXRFbmQoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjbG9zZSBhdXRvIGNvbXBsZXRlIGlmIG9wZW5cbiAgICAgICAgLy8gdGhpcyB3b3VsZCBoYXBwZW4gd2hlbiBjbGVhcmluZyB0aGUgY29tcG9zZXIgYWZ0ZXIgc2VuZGluZ1xuICAgICAgICAvLyBhIG1lc3NhZ2Ugd2l0aCB0aGUgYXV0b2NvbXBsZXRlIHN0aWxsIG9wZW5cbiAgICAgICAgaWYgKHRoaXMuX2F1dG9Db21wbGV0ZSkge1xuICAgICAgICAgICAgdGhpcy5fYXV0b0NvbXBsZXRlID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX2F1dG9Db21wbGV0ZVBhcnRJZHggPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNhbGxiYWNrKGNhcmV0LCBpbnB1dFR5cGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluc2VydHMgdGhlIGdpdmVuIHBhcnRzIGF0IHRoZSBnaXZlbiBwb3NpdGlvbi5cbiAgICAgKiBTaG91bGQgYmUgcnVuIGluc2lkZSBhIGBtb2RlbC50cmFuc2Zvcm0oKWAgY2FsbGJhY2suXG4gICAgICogQHBhcmFtIHtQYXJ0W119IHBhcnRzIHRoZSBwYXJ0cyB0byByZXBsYWNlIHRoZSByYW5nZSB3aXRoXG4gICAgICogQHBhcmFtIHtEb2N1bWVudFBvc2l0aW9ufSBwb3NpdGlvbiB0aGUgcG9zaXRpb24gdG8gc3RhcnQgaW5zZXJ0aW5nIGF0XG4gICAgICogQHJldHVybiB7TnVtYmVyfSB0aGUgYW1vdW50IG9mIGNoYXJhY3RlcnMgYWRkZWRcbiAgICAgKi9cbiAgICBpbnNlcnQocGFydHMsIHBvc2l0aW9uKSB7XG4gICAgICAgIGNvbnN0IGluc2VydEluZGV4ID0gdGhpcy5fc3BsaXRBdChwb3NpdGlvbik7XG4gICAgICAgIGxldCBuZXdUZXh0TGVuZ3RoID0gMDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgY29uc3QgcGFydCA9IHBhcnRzW2ldO1xuICAgICAgICAgICAgbmV3VGV4dExlbmd0aCArPSBwYXJ0LnRleHQubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5faW5zZXJ0UGFydChpbnNlcnRJbmRleCArIGksIHBhcnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdUZXh0TGVuZ3RoO1xuICAgIH1cblxuICAgIHVwZGF0ZShuZXdWYWx1ZSwgaW5wdXRUeXBlLCBjYXJldCkge1xuICAgICAgICBjb25zdCBkaWZmID0gdGhpcy5fZGlmZihuZXdWYWx1ZSwgaW5wdXRUeXBlLCBjYXJldCk7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbkZvck9mZnNldChkaWZmLmF0LCBjYXJldC5hdE5vZGVFbmQpO1xuICAgICAgICBsZXQgcmVtb3ZlZE9mZnNldERlY3JlYXNlID0gMDtcbiAgICAgICAgaWYgKGRpZmYucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmVtb3ZlZE9mZnNldERlY3JlYXNlID0gdGhpcy5yZW1vdmVUZXh0KHBvc2l0aW9uLCBkaWZmLnJlbW92ZWQubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgYWRkZWRMZW4gPSAwO1xuICAgICAgICBpZiAoZGlmZi5hZGRlZCkge1xuICAgICAgICAgICAgYWRkZWRMZW4gPSB0aGlzLl9hZGRUZXh0KHBvc2l0aW9uLCBkaWZmLmFkZGVkLCBpbnB1dFR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX21lcmdlQWRqYWNlbnRQYXJ0cygpO1xuICAgICAgICBjb25zdCBjYXJldE9mZnNldCA9IGRpZmYuYXQgLSByZW1vdmVkT2Zmc2V0RGVjcmVhc2UgKyBhZGRlZExlbjtcbiAgICAgICAgbGV0IG5ld1Bvc2l0aW9uID0gdGhpcy5wb3NpdGlvbkZvck9mZnNldChjYXJldE9mZnNldCwgdHJ1ZSk7XG4gICAgICAgIGNvbnN0IGNhbk9wZW5BdXRvQ29tcGxldGUgPSBpbnB1dFR5cGUgIT09IFwiaW5zZXJ0RnJvbVBhc3RlXCIgJiYgaW5wdXRUeXBlICE9PSBcImluc2VydEZyb21Ecm9wXCI7XG4gICAgICAgIGNvbnN0IGFjUHJvbWlzZSA9IHRoaXMuX3NldEFjdGl2ZVBhcnQobmV3UG9zaXRpb24sIGNhbk9wZW5BdXRvQ29tcGxldGUpO1xuICAgICAgICBpZiAodGhpcy5fdHJhbnNmb3JtQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zZm9ybUFkZGVkTGVuID0gdGhpcy5fdHJhbnNmb3JtKG5ld1Bvc2l0aW9uLCBpbnB1dFR5cGUsIGRpZmYpO1xuICAgICAgICAgICAgbmV3UG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uRm9yT2Zmc2V0KGNhcmV0T2Zmc2V0ICsgdHJhbnNmb3JtQWRkZWRMZW4sIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNhbGxiYWNrKG5ld1Bvc2l0aW9uLCBpbnB1dFR5cGUsIGRpZmYpO1xuICAgICAgICByZXR1cm4gYWNQcm9taXNlO1xuICAgIH1cblxuICAgIF90cmFuc2Zvcm0obmV3UG9zaXRpb24sIGlucHV0VHlwZSwgZGlmZikge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl90cmFuc2Zvcm1DYWxsYmFjayhuZXdQb3NpdGlvbiwgaW5wdXRUeXBlLCBkaWZmKTtcbiAgICAgICAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZShyZXN1bHQpID8gcmVzdWx0IDogMDtcbiAgICB9XG5cbiAgICBfc2V0QWN0aXZlUGFydChwb3MsIGNhbk9wZW5BdXRvQ29tcGxldGUpIHtcbiAgICAgICAgY29uc3Qge2luZGV4fSA9IHBvcztcbiAgICAgICAgY29uc3QgcGFydCA9IHRoaXMuX3BhcnRzW2luZGV4XTtcbiAgICAgICAgaWYgKHBhcnQpIHtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gdGhpcy5fYWN0aXZlUGFydElkeCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVBhcnRJZHggPSBpbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoY2FuT3BlbkF1dG9Db21wbGV0ZSAmJiB0aGlzLl9hY3RpdmVQYXJ0SWR4ICE9PSB0aGlzLl9hdXRvQ29tcGxldGVQYXJ0SWR4KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVsc2UgdHJ5IHRvIGNyZWF0ZSBvbmVcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWMgPSBwYXJ0LmNyZWF0ZUF1dG9Db21wbGV0ZSh0aGlzLl9vbkF1dG9Db21wbGV0ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHRoYXQgcmVhY3QgcGlja3MgdXAgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBib3RoIGFjc1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXV0b0NvbXBsZXRlID0gYWM7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hdXRvQ29tcGxldGVQYXJ0SWR4ID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hdXRvQ29tcGxldGVQYXJ0Q291bnQgPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gbm90IF9hdXRvQ29tcGxldGUsIG9ubHkgdGhlcmUgaWYgYWN0aXZlIHBhcnQgaXMgYXV0b2NvbXBsZXRlIHBhcnRcbiAgICAgICAgICAgIGlmICh0aGlzLmF1dG9Db21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmF1dG9Db21wbGV0ZS5vblBhcnRVcGRhdGUocGFydCwgcG9zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVBhcnRJZHggPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fYXV0b0NvbXBsZXRlID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX2F1dG9Db21wbGV0ZVBhcnRJZHggPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fYXV0b0NvbXBsZXRlUGFydENvdW50ID0gMDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgX29uQXV0b0NvbXBsZXRlID0gKHtyZXBsYWNlUGFydHMsIGNsb3NlfSkgPT4ge1xuICAgICAgICBsZXQgcG9zO1xuICAgICAgICBpZiAocmVwbGFjZVBhcnRzKSB7XG4gICAgICAgICAgICB0aGlzLl9wYXJ0cy5zcGxpY2UodGhpcy5fYXV0b0NvbXBsZXRlUGFydElkeCwgdGhpcy5fYXV0b0NvbXBsZXRlUGFydENvdW50LCAuLi5yZXBsYWNlUGFydHMpO1xuICAgICAgICAgICAgdGhpcy5fYXV0b0NvbXBsZXRlUGFydENvdW50ID0gcmVwbGFjZVBhcnRzLmxlbmd0aDtcbiAgICAgICAgICAgIGNvbnN0IGxhc3RQYXJ0ID0gcmVwbGFjZVBhcnRzW3JlcGxhY2VQYXJ0cy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGNvbnN0IGxhc3RQYXJ0SW5kZXggPSB0aGlzLl9hdXRvQ29tcGxldGVQYXJ0SWR4ICsgcmVwbGFjZVBhcnRzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICBwb3MgPSBuZXcgRG9jdW1lbnRQb3NpdGlvbihsYXN0UGFydEluZGV4LCBsYXN0UGFydC50ZXh0Lmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNsb3NlKSB7XG4gICAgICAgICAgICB0aGlzLl9hdXRvQ29tcGxldGUgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fYXV0b0NvbXBsZXRlUGFydElkeCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9hdXRvQ29tcGxldGVQYXJ0Q291bnQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlcmVuZGVyIGV2ZW4gaWYgZWRpdG9yIGNvbnRlbnRzIGRpZG4ndCBjaGFuZ2VcbiAgICAgICAgLy8gdG8gbWFrZSBzdXJlIHRoZSBNZXNzYWdlRWRpdG9yIGNoZWNrc1xuICAgICAgICAvLyBtb2RlbC5hdXRvQ29tcGxldGUgYmVpbmcgZW1wdHkgYW5kIGNsb3NlcyBpdFxuICAgICAgICB0aGlzLl91cGRhdGVDYWxsYmFjayhwb3MpO1xuICAgIH1cblxuICAgIF9tZXJnZUFkamFjZW50UGFydHMoKSB7XG4gICAgICAgIGxldCBwcmV2UGFydDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9wYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgbGV0IHBhcnQgPSB0aGlzLl9wYXJ0c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGlzRW1wdHkgPSAhcGFydC50ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIGNvbnN0IGlzTWVyZ2VkID0gIWlzRW1wdHkgJiYgcHJldlBhcnQgJiYgcHJldlBhcnQubWVyZ2UocGFydCk7XG4gICAgICAgICAgICBpZiAoaXNFbXB0eSB8fCBpc01lcmdlZCkge1xuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBlbXB0eSBvciBtZXJnZWQgcGFydFxuICAgICAgICAgICAgICAgIHBhcnQgPSBwcmV2UGFydDtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVQYXJ0KGkpO1xuICAgICAgICAgICAgICAgIC8vcmVwZWF0IHRoaXMgaW5kZXgsIGFzIGl0J3MgcmVtb3ZlZCBub3dcbiAgICAgICAgICAgICAgICAtLWk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmV2UGFydCA9IHBhcnQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZW1vdmVzIGBsZW5gIGFtb3VudCBvZiBjaGFyYWN0ZXJzIGF0IGBwb3NgLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwb3NcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbGVuXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBob3cgbWFueSBjaGFyYWN0ZXJzIGJlZm9yZSBwb3Mgd2VyZSBhbHNvIHJlbW92ZWQsXG4gICAgICogdXN1YWxseSBiZWNhdXNlIG9mIG5vbi1lZGl0YWJsZSBwYXJ0cyB0aGF0IGNhbiBvbmx5IGJlIHJlbW92ZWQgaW4gdGhlaXIgZW50aXJldHkuXG4gICAgICovXG4gICAgcmVtb3ZlVGV4dChwb3MsIGxlbikge1xuICAgICAgICBsZXQge2luZGV4LCBvZmZzZXR9ID0gcG9zO1xuICAgICAgICBsZXQgcmVtb3ZlZE9mZnNldERlY3JlYXNlID0gMDtcbiAgICAgICAgd2hpbGUgKGxlbiA+IDApIHtcbiAgICAgICAgICAgIC8vIHBhcnQgbWlnaHQgYmUgdW5kZWZpbmVkIGhlcmVcbiAgICAgICAgICAgIGxldCBwYXJ0ID0gdGhpcy5fcGFydHNbaW5kZXhdO1xuICAgICAgICAgICAgY29uc3QgYW1vdW50ID0gTWF0aC5taW4obGVuLCBwYXJ0LnRleHQubGVuZ3RoIC0gb2Zmc2V0KTtcbiAgICAgICAgICAgIC8vIGRvbid0IGFsbG93IDAgYW1vdW50IGRlbGV0aW9uc1xuICAgICAgICAgICAgaWYgKGFtb3VudCkge1xuICAgICAgICAgICAgICAgIGlmIChwYXJ0LmNhbkVkaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwbGFjZVdpdGggPSBwYXJ0LnJlbW92ZShvZmZzZXQsIGFtb3VudCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVwbGFjZVdpdGggPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlcGxhY2VQYXJ0KGluZGV4LCB0aGlzLl9wYXJ0Q3JlYXRvci5jcmVhdGVEZWZhdWx0UGFydChyZXBsYWNlV2l0aCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHBhcnQgPSB0aGlzLl9wYXJ0c1tpbmRleF07XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBlbXB0eSBwYXJ0XG4gICAgICAgICAgICAgICAgICAgIGlmICghcGFydC50ZXh0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlUGFydChpbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCArPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZE9mZnNldERlY3JlYXNlICs9IG9mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlUGFydChpbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmRleCArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGVuIC09IGFtb3VudDtcbiAgICAgICAgICAgIG9mZnNldCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlbW92ZWRPZmZzZXREZWNyZWFzZTtcbiAgICB9XG4gICAgLy8gcmV0dXJuIHBhcnQgaW5kZXggd2hlcmUgaW5zZXJ0aW9uIHdpbGwgaW5zZXJ0IGJldHdlZW4gYXQgb2Zmc2V0XG4gICAgX3NwbGl0QXQocG9zKSB7XG4gICAgICAgIGlmIChwb3MuaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocG9zLm9mZnNldCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHBvcy5pbmRleDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYXJ0ID0gdGhpcy5fcGFydHNbcG9zLmluZGV4XTtcbiAgICAgICAgaWYgKHBvcy5vZmZzZXQgPj0gcGFydC50ZXh0Lmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHBvcy5pbmRleCArIDE7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZWNvbmRQYXJ0ID0gcGFydC5zcGxpdChwb3Mub2Zmc2V0KTtcbiAgICAgICAgdGhpcy5faW5zZXJ0UGFydChwb3MuaW5kZXggKyAxLCBzZWNvbmRQYXJ0KTtcbiAgICAgICAgcmV0dXJuIHBvcy5pbmRleCArIDE7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogaW5zZXJ0cyBgc3RyYCBpbnRvIHRoZSBtb2RlbCBhdCBgcG9zYC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcG9zXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dFR5cGUgdGhlIHNvdXJjZSBvZiB0aGUgaW5wdXQsIHNlZSBodG1sIElucHV0RXZlbnQuaW5wdXRUeXBlXG4gICAgICogQHBhcmFtIHtib29sfSBvcHRpb25zLnZhbGlkYXRlIFdoZXRoZXIgY2hhcmFjdGVycyB3aWxsIGJlIHZhbGlkYXRlZCBieSB0aGUgcGFydC5cbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmFsaWRhdGluZyBhbGxvd3MgdGhlIGluc2VydGVkIHRleHQgdG8gYmUgcGFyc2VkIGFjY29yZGluZyB0byB0aGUgcGFydCBydWxlcy5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IGhvdyBmYXIgZnJvbSBwb3NpdGlvbiAoaW4gY2hhcmFjdGVycykgdGhlIGluc2VydGlvbiBlbmRlZC5cbiAgICAgKiBUaGlzIGNhbiBiZSBtb3JlIHRoYW4gdGhlIGxlbmd0aCBvZiBgc3RyYCB3aGVuIGNyb3NzaW5nIG5vbi1lZGl0YWJsZSBwYXJ0cywgd2hpY2ggYXJlIHNraXBwZWQuXG4gICAgICovXG4gICAgX2FkZFRleHQocG9zLCBzdHIsIGlucHV0VHlwZSkge1xuICAgICAgICBsZXQge2luZGV4fSA9IHBvcztcbiAgICAgICAgY29uc3Qge29mZnNldH0gPSBwb3M7XG4gICAgICAgIGxldCBhZGRMZW4gPSBzdHIubGVuZ3RoO1xuICAgICAgICBjb25zdCBwYXJ0ID0gdGhpcy5fcGFydHNbaW5kZXhdO1xuICAgICAgICBpZiAocGFydCkge1xuICAgICAgICAgICAgaWYgKHBhcnQuY2FuRWRpdCkge1xuICAgICAgICAgICAgICAgIGlmIChwYXJ0LnZhbGlkYXRlQW5kSW5zZXJ0KG9mZnNldCwgc3RyLCBpbnB1dFR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0ciA9IG51bGw7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRQYXJ0ID0gcGFydC5zcGxpdChvZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgICBpbmRleCArPSAxO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbnNlcnRQYXJ0KGluZGV4LCBzcGxpdFBhcnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAob2Zmc2V0ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gbm90LWVkaXRhYmxlIHBhcnQsIGNhcmV0IGlzIG5vdCBhdCBzdGFydCxcbiAgICAgICAgICAgICAgICAvLyBzbyBpbnNlcnQgc3RyIGFmdGVyIHRoaXMgcGFydFxuICAgICAgICAgICAgICAgIGFkZExlbiArPSBwYXJ0LnRleHQubGVuZ3RoIC0gb2Zmc2V0O1xuICAgICAgICAgICAgICAgIGluZGV4ICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoaW5kZXggPCAwKSB7XG4gICAgICAgICAgICAvLyBpZiBwb3NpdGlvbiB3YXMgbm90IGZvdW5kIChpbmRleDogLTEsIGFzIGhhcHBlbnMgZm9yIGVtcHR5IGVkaXRvcilcbiAgICAgICAgICAgIC8vIHJlc2V0IGl0IHRvIGluc2VydCBhcyBmaXJzdCBwYXJ0XG4gICAgICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKHN0cikge1xuICAgICAgICAgICAgY29uc3QgbmV3UGFydCA9IHRoaXMuX3BhcnRDcmVhdG9yLmNyZWF0ZVBhcnRGb3JJbnB1dChzdHIsIGluZGV4LCBpbnB1dFR5cGUpO1xuICAgICAgICAgICAgc3RyID0gbmV3UGFydC5hcHBlbmRVbnRpbFJlamVjdGVkKHN0ciwgaW5wdXRUeXBlKTtcbiAgICAgICAgICAgIHRoaXMuX2luc2VydFBhcnQoaW5kZXgsIG5ld1BhcnQpO1xuICAgICAgICAgICAgaW5kZXggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWRkTGVuO1xuICAgIH1cblxuICAgIHBvc2l0aW9uRm9yT2Zmc2V0KHRvdGFsT2Zmc2V0LCBhdFBhcnRFbmQpIHtcbiAgICAgICAgbGV0IGN1cnJlbnRPZmZzZXQgPSAwO1xuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuX3BhcnRzLmZpbmRJbmRleChwYXJ0ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRMZW4gPSBwYXJ0LnRleHQubGVuZ3RoO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIChhdFBhcnRFbmQgJiYgKGN1cnJlbnRPZmZzZXQgKyBwYXJ0TGVuKSA+PSB0b3RhbE9mZnNldCkgfHxcbiAgICAgICAgICAgICAgICAoIWF0UGFydEVuZCAmJiAoY3VycmVudE9mZnNldCArIHBhcnRMZW4pID4gdG90YWxPZmZzZXQpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJlbnRPZmZzZXQgKz0gcGFydExlbjtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFBvc2l0aW9uQXRFbmQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRG9jdW1lbnRQb3NpdGlvbihpbmRleCwgdG90YWxPZmZzZXQgLSBjdXJyZW50T2Zmc2V0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0YXJ0cyBhIHJhbmdlLCB3aGljaCBjYW4gc3BhbiBhY3Jvc3MgbXVsdGlwbGUgcGFydHMsIHRvIGZpbmQgYW5kIHJlcGxhY2UgdGV4dC5cbiAgICAgKiBAcGFyYW0ge0RvY3VtZW50UG9zaXRpb259IHBvc2l0aW9uQSBhIGJvdW5kYXJ5IG9mIHRoZSByYW5nZVxuICAgICAqIEBwYXJhbSB7RG9jdW1lbnRQb3NpdGlvbj99IHBvc2l0aW9uQiB0aGUgb3RoZXIgYm91bmRhcnkgb2YgdGhlIHJhbmdlLCBvcHRpb25hbFxuICAgICAqIEByZXR1cm4ge1JhbmdlfVxuICAgICAqL1xuICAgIHN0YXJ0UmFuZ2UocG9zaXRpb25BLCBwb3NpdGlvbkIgPSBwb3NpdGlvbkEpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSYW5nZSh0aGlzLCBwb3NpdGlvbkEsIHBvc2l0aW9uQik7XG4gICAgfVxuXG4gICAgLy8gY2FsbGVkIGZyb20gUmFuZ2UucmVwbGFjZVxuICAgIF9yZXBsYWNlUmFuZ2Uoc3RhcnRQb3NpdGlvbiwgZW5kUG9zaXRpb24sIHBhcnRzKSB7XG4gICAgICAgIC8vIGNvbnZlcnQgZW5kIHBvc2l0aW9uIHRvIG9mZnNldCwgc28gaXQgaXMgaW5kZXBlbmRlbnQgb2YgaG93IHRoZSBkb2N1bWVudCBpcyBzcGxpdCBpbnRvIHBhcnRzXG4gICAgICAgIC8vIHdoaWNoIHdlJ2xsIGNoYW5nZSB3aGVuIHNwbGl0dGluZyB1cCBhdCB0aGUgc3RhcnQgcG9zaXRpb25cbiAgICAgICAgY29uc3QgZW5kT2Zmc2V0ID0gZW5kUG9zaXRpb24uYXNPZmZzZXQodGhpcyk7XG4gICAgICAgIGNvbnN0IG5ld1N0YXJ0UGFydEluZGV4ID0gdGhpcy5fc3BsaXRBdChzdGFydFBvc2l0aW9uKTtcbiAgICAgICAgLy8gY29udmVydCBpdCBiYWNrIHRvIHBvc2l0aW9uIG9uY2Ugc3BsaXQgYXQgc3RhcnRcbiAgICAgICAgZW5kUG9zaXRpb24gPSBlbmRPZmZzZXQuYXNQb3NpdGlvbih0aGlzKTtcbiAgICAgICAgY29uc3QgbmV3RW5kUGFydEluZGV4ID0gdGhpcy5fc3BsaXRBdChlbmRQb3NpdGlvbik7XG4gICAgICAgIGZvciAobGV0IGkgPSBuZXdFbmRQYXJ0SW5kZXggLSAxOyBpID49IG5ld1N0YXJ0UGFydEluZGV4OyAtLWkpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZVBhcnQoaSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGluc2VydElkeCA9IG5ld1N0YXJ0UGFydEluZGV4O1xuICAgICAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGFydHMpIHtcbiAgICAgICAgICAgIHRoaXMuX2luc2VydFBhcnQoaW5zZXJ0SWR4LCBwYXJ0KTtcbiAgICAgICAgICAgIGluc2VydElkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX21lcmdlQWRqYWNlbnRQYXJ0cygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGEgdHJhbnNmb3JtYXRpb24gbm90IHBhcnQgb2YgYW4gdXBkYXRlIGN5Y2xlLlxuICAgICAqIE1vZGlmeWluZyB0aGUgbW9kZWwgc2hvdWxkIG9ubHkgaGFwcGVuIGluc2lkZSBhIHRyYW5zZm9ybSBjYWxsIGlmIG5vdCBwYXJ0IG9mIGFuIHVwZGF0ZSBjYWxsLlxuICAgICAqIEBwYXJhbSB7TWFudWFsVHJhbnNmb3JtQ2FsbGJhY2t9IGNhbGxiYWNrIHRvIHJ1biB0aGUgdHJhbnNmb3JtYXRpb25zIGluXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gYSBwcm9taXNlIHdoZW4gYXV0by1jb21wbGV0ZSAoaWYgYXBwbGljYWJsZSkgaXMgZG9uZSB1cGRhdGluZ1xuICAgICAqL1xuICAgIHRyYW5zZm9ybShjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBwb3MgPSBjYWxsYmFjaygpO1xuICAgICAgICBsZXQgYWNQcm9taXNlID0gbnVsbDtcbiAgICAgICAgaWYgKCEocG9zIGluc3RhbmNlb2YgUmFuZ2UpKSB7XG4gICAgICAgICAgICBhY1Byb21pc2UgPSB0aGlzLl9zZXRBY3RpdmVQYXJ0KHBvcywgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhY1Byb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl91cGRhdGVDYWxsYmFjayhwb3MpO1xuICAgICAgICByZXR1cm4gYWNQcm9taXNlO1xuICAgIH1cbn1cbiJdfQ==