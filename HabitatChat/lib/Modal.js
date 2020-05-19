"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _react = _interopRequireDefault(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _Analytics = _interopRequireDefault(require("./Analytics"));

var _dispatcher = _interopRequireDefault(require("./dispatcher/dispatcher"));

var _promise = require("./utils/promise");

var _AsyncWrapper = _interopRequireDefault(require("./AsyncWrapper"));

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
const DIALOG_CONTAINER_ID = "mx_Dialog_Container";
const STATIC_DIALOG_CONTAINER_ID = "mx_Dialog_StaticContainer";

class ModalManager {
  constructor() {
    this._counter = 0; // The modal to prioritise over all others. If this is set, only show
    // this modal. Remove all other modals from the stack when this modal
    // is closed.

    this._priorityModal = null; // The modal to keep open underneath other modals if possible. Useful
    // for cases like Settings where the modal should remain open while the
    // user is prompted for more information/errors.

    this._staticModal = null; // A list of the modals we have stacked up, with the most recent at [0]
    // Neither the static nor priority modal will be in this list.

    this._modals = [
      /* {
         elem: React component for this dialog
         onFinished: caller-supplied onFinished callback
         className: CSS class for the dialog wrapper div
         } */
    ];
    this.onBackgroundClick = this.onBackgroundClick.bind(this);
  }

  hasDialogs() {
    return this._priorityModal || this._staticModal || this._modals.length > 0;
  }

  getOrCreateContainer() {
    let container = document.getElementById(DIALOG_CONTAINER_ID);

    if (!container) {
      container = document.createElement("div");
      container.id = DIALOG_CONTAINER_ID;
      document.body.appendChild(container);
    }

    return container;
  }

  getOrCreateStaticContainer() {
    let container = document.getElementById(STATIC_DIALOG_CONTAINER_ID);

    if (!container) {
      container = document.createElement("div");
      container.id = STATIC_DIALOG_CONTAINER_ID;
      document.body.appendChild(container);
    }

    return container;
  }

  createTrackedDialog(analyticsAction, analyticsInfo, ...rest) {
    _Analytics.default.trackEvent('Modal', analyticsAction, analyticsInfo);

    return this.createDialog(...rest);
  }

  appendTrackedDialog(analyticsAction, analyticsInfo, ...rest) {
    _Analytics.default.trackEvent('Modal', analyticsAction, analyticsInfo);

    return this.appendDialog(...rest);
  }

  createDialog(Element, ...rest) {
    return this.createDialogAsync(Promise.resolve(Element), ...rest);
  }

  appendDialog(Element, ...rest) {
    return this.appendDialogAsync(Promise.resolve(Element), ...rest);
  }

  createTrackedDialogAsync(analyticsAction, analyticsInfo, ...rest) {
    _Analytics.default.trackEvent('Modal', analyticsAction, analyticsInfo);

    return this.createDialogAsync(...rest);
  }

  appendTrackedDialogAsync(analyticsAction, analyticsInfo, ...rest) {
    _Analytics.default.trackEvent('Modal', analyticsAction, analyticsInfo);

    return this.appendDialogAsync(...rest);
  }

  _buildModal(prom, props, className, options) {
    const modal = {}; // never call this from onFinished() otherwise it will loop

    const [closeDialog, onFinishedProm] = this._getCloseFn(modal, props); // don't attempt to reuse the same AsyncWrapper for different dialogs,
    // otherwise we'll get confused.


    const modalCount = this._counter++; // FIXME: If a dialog uses getDefaultProps it clobbers the onFinished
    // property set here so you can't close the dialog from a button click!

    modal.elem = /*#__PURE__*/_react.default.createElement(_AsyncWrapper.default, (0, _extends2.default)({
      key: modalCount,
      prom: prom
    }, props, {
      onFinished: closeDialog
    }));
    modal.onFinished = props ? props.onFinished : null;
    modal.className = className;
    modal.onBeforeClose = options.onBeforeClose;
    modal.beforeClosePromise = null;
    modal.close = closeDialog;
    modal.closeReason = null;
    return {
      modal,
      closeDialog,
      onFinishedProm
    };
  }

  _getCloseFn(modal, props) {
    const deferred = (0, _promise.defer)();
    return [async (...args) => {
      if (modal.beforeClosePromise) {
        await modal.beforeClosePromise;
      } else if (modal.onBeforeClose) {
        modal.beforeClosePromise = modal.onBeforeClose(modal.closeReason);
        const shouldClose = await modal.beforeClosePromise;
        modal.beforeClosePromise = null;

        if (!shouldClose) {
          return;
        }
      }

      deferred.resolve(args);
      if (props && props.onFinished) props.onFinished.apply(null, args);

      const i = this._modals.indexOf(modal);

      if (i >= 0) {
        this._modals.splice(i, 1);
      }

      if (this._priorityModal === modal) {
        this._priorityModal = null; // XXX: This is destructive

        this._modals = [];
      }

      if (this._staticModal === modal) {
        this._staticModal = null; // XXX: This is destructive

        this._modals = [];
      }

      this._reRender();
    }, deferred.promise];
  }
  /**
   * @callback onBeforeClose
   * @param {string?} reason either "backgroundClick" or null
   * @return {Promise<bool>} whether the dialog should close
   */

  /**
   * Open a modal view.
   *
   * This can be used to display a react component which is loaded as an asynchronous
   * webpack component. To do this, set 'loader' as:
   *
   *   (cb) => {
   *       require(['<module>'], cb);
   *   }
   *
   * @param {Promise} prom   a promise which resolves with a React component
   *   which will be displayed as the modal view.
   *
   * @param {Object} props   properties to pass to the displayed
   *    component. (We will also pass an 'onFinished' property.)
   *
   * @param {String} className   CSS class to apply to the modal wrapper
   *
   * @param {boolean} isPriorityModal if true, this modal will be displayed regardless
   *                                  of other modals that are currently in the stack.
   *                                  Also, when closed, all modals will be removed
   *                                  from the stack.
   * @param {boolean} isStaticModal  if true, this modal will be displayed under other
   *                                 modals in the stack. When closed, all modals will
   *                                 also be removed from the stack. This is not compatible
   *                                 with being a priority modal. Only one modal can be
   *                                 static at a time.
   * @param {Object} options? extra options for the dialog
   * @param {onBeforeClose} options.onBeforeClose a callback to decide whether to close the dialog
   * @returns {object} Object with 'close' parameter being a function that will close the dialog
   */


  createDialogAsync(prom, props, className, isPriorityModal, isStaticModal, options = {}) {
    const {
      modal,
      closeDialog,
      onFinishedProm
    } = this._buildModal(prom, props, className, options);

    if (isPriorityModal) {
      // XXX: This is destructive
      this._priorityModal = modal;
    } else if (isStaticModal) {
      // This is intentionally destructive
      this._staticModal = modal;
    } else {
      this._modals.unshift(modal);
    }

    this._reRender();

    return {
      close: closeDialog,
      finished: onFinishedProm
    };
  }

  appendDialogAsync(prom, props, className) {
    const {
      modal,
      closeDialog,
      onFinishedProm
    } = this._buildModal(prom, props, className, {});

    this._modals.push(modal);

    this._reRender();

    return {
      close: closeDialog,
      finished: onFinishedProm
    };
  }

  onBackgroundClick() {
    const modal = this._getCurrentModal();

    if (!modal) {
      return;
    } // we want to pass a reason to the onBeforeClose
    // callback, but close is currently defined to
    // pass all number of arguments to the onFinished callback
    // so, pass the reason to close through a member variable


    modal.closeReason = "backgroundClick";
    modal.close();
    modal.closeReason = null;
  }

  _getCurrentModal() {
    return this._priorityModal ? this._priorityModal : this._modals[0] || this._staticModal;
  }

  _reRender() {
    if (this._modals.length === 0 && !this._priorityModal && !this._staticModal) {
      // If there is no modal to render, make all of Riot available
      // to screen reader users again
      _dispatcher.default.dispatch({
        action: 'aria_unhide_main_app'
      });

      _reactDom.default.unmountComponentAtNode(this.getOrCreateContainer());

      _reactDom.default.unmountComponentAtNode(this.getOrCreateStaticContainer());

      return;
    } // Hide the content outside the modal to screen reader users
    // so they won't be able to navigate into it and act on it using
    // screen reader specific features


    _dispatcher.default.dispatch({
      action: 'aria_hide_main_app'
    });

    if (this._staticModal) {
      const classes = "mx_Dialog_wrapper mx_Dialog_staticWrapper " + (this._staticModal.className ? this._staticModal.className : '');

      const staticDialog = /*#__PURE__*/_react.default.createElement("div", {
        className: classes
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Dialog"
      }, this._staticModal.elem), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Dialog_background mx_Dialog_staticBackground",
        onClick: this.onBackgroundClick
      }));

      _reactDom.default.render(staticDialog, this.getOrCreateStaticContainer());
    } else {
      // This is safe to call repeatedly if we happen to do that
      _reactDom.default.unmountComponentAtNode(this.getOrCreateStaticContainer());
    }

    const modal = this._getCurrentModal();

    if (modal !== this._staticModal) {
      const classes = "mx_Dialog_wrapper " + (this._staticModal ? "mx_Dialog_wrapperWithStaticUnder " : '') + (modal.className ? modal.className : '');

      const dialog = /*#__PURE__*/_react.default.createElement("div", {
        className: classes
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Dialog"
      }, modal.elem), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Dialog_background",
        onClick: this.onBackgroundClick
      }));

      _reactDom.default.render(dialog, this.getOrCreateContainer());
    } else {
      // This is safe to call repeatedly if we happen to do that
      _reactDom.default.unmountComponentAtNode(this.getOrCreateContainer());
    }
  }

}

if (!global.singletonModalManager) {
  global.singletonModalManager = new ModalManager();
}

var _default = global.singletonModalManager;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Nb2RhbC5qcyJdLCJuYW1lcyI6WyJESUFMT0dfQ09OVEFJTkVSX0lEIiwiU1RBVElDX0RJQUxPR19DT05UQUlORVJfSUQiLCJNb2RhbE1hbmFnZXIiLCJjb25zdHJ1Y3RvciIsIl9jb3VudGVyIiwiX3ByaW9yaXR5TW9kYWwiLCJfc3RhdGljTW9kYWwiLCJfbW9kYWxzIiwib25CYWNrZ3JvdW5kQ2xpY2siLCJiaW5kIiwiaGFzRGlhbG9ncyIsImxlbmd0aCIsImdldE9yQ3JlYXRlQ29udGFpbmVyIiwiY29udGFpbmVyIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsImNyZWF0ZUVsZW1lbnQiLCJpZCIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImdldE9yQ3JlYXRlU3RhdGljQ29udGFpbmVyIiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsImFuYWx5dGljc0FjdGlvbiIsImFuYWx5dGljc0luZm8iLCJyZXN0IiwiQW5hbHl0aWNzIiwidHJhY2tFdmVudCIsImNyZWF0ZURpYWxvZyIsImFwcGVuZFRyYWNrZWREaWFsb2ciLCJhcHBlbmREaWFsb2ciLCJFbGVtZW50IiwiY3JlYXRlRGlhbG9nQXN5bmMiLCJQcm9taXNlIiwicmVzb2x2ZSIsImFwcGVuZERpYWxvZ0FzeW5jIiwiY3JlYXRlVHJhY2tlZERpYWxvZ0FzeW5jIiwiYXBwZW5kVHJhY2tlZERpYWxvZ0FzeW5jIiwiX2J1aWxkTW9kYWwiLCJwcm9tIiwicHJvcHMiLCJjbGFzc05hbWUiLCJvcHRpb25zIiwibW9kYWwiLCJjbG9zZURpYWxvZyIsIm9uRmluaXNoZWRQcm9tIiwiX2dldENsb3NlRm4iLCJtb2RhbENvdW50IiwiZWxlbSIsIm9uRmluaXNoZWQiLCJvbkJlZm9yZUNsb3NlIiwiYmVmb3JlQ2xvc2VQcm9taXNlIiwiY2xvc2UiLCJjbG9zZVJlYXNvbiIsImRlZmVycmVkIiwiYXJncyIsInNob3VsZENsb3NlIiwiYXBwbHkiLCJpIiwiaW5kZXhPZiIsInNwbGljZSIsIl9yZVJlbmRlciIsInByb21pc2UiLCJpc1ByaW9yaXR5TW9kYWwiLCJpc1N0YXRpY01vZGFsIiwidW5zaGlmdCIsImZpbmlzaGVkIiwicHVzaCIsIl9nZXRDdXJyZW50TW9kYWwiLCJkaXMiLCJkaXNwYXRjaCIsImFjdGlvbiIsIlJlYWN0RE9NIiwidW5tb3VudENvbXBvbmVudEF0Tm9kZSIsImNsYXNzZXMiLCJzdGF0aWNEaWFsb2ciLCJyZW5kZXIiLCJkaWFsb2ciLCJnbG9iYWwiLCJzaW5nbGV0b25Nb2RhbE1hbmFnZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXRCQTs7Ozs7Ozs7Ozs7Ozs7O0FBd0JBLE1BQU1BLG1CQUFtQixHQUFHLHFCQUE1QjtBQUNBLE1BQU1DLDBCQUEwQixHQUFHLDJCQUFuQzs7QUFFQSxNQUFNQyxZQUFOLENBQW1CO0FBQ2ZDLEVBQUFBLFdBQVcsR0FBRztBQUNWLFNBQUtDLFFBQUwsR0FBZ0IsQ0FBaEIsQ0FEVSxDQUdWO0FBQ0E7QUFDQTs7QUFDQSxTQUFLQyxjQUFMLEdBQXNCLElBQXRCLENBTlUsQ0FPVjtBQUNBO0FBQ0E7O0FBQ0EsU0FBS0MsWUFBTCxHQUFvQixJQUFwQixDQVZVLENBV1Y7QUFDQTs7QUFDQSxTQUFLQyxPQUFMLEdBQWU7QUFDWDs7Ozs7QUFEVyxLQUFmO0FBUUEsU0FBS0MsaUJBQUwsR0FBeUIsS0FBS0EsaUJBQUwsQ0FBdUJDLElBQXZCLENBQTRCLElBQTVCLENBQXpCO0FBQ0g7O0FBRURDLEVBQUFBLFVBQVUsR0FBRztBQUNULFdBQU8sS0FBS0wsY0FBTCxJQUF1QixLQUFLQyxZQUE1QixJQUE0QyxLQUFLQyxPQUFMLENBQWFJLE1BQWIsR0FBc0IsQ0FBekU7QUFDSDs7QUFFREMsRUFBQUEsb0JBQW9CLEdBQUc7QUFDbkIsUUFBSUMsU0FBUyxHQUFHQyxRQUFRLENBQUNDLGNBQVQsQ0FBd0JmLG1CQUF4QixDQUFoQjs7QUFFQSxRQUFJLENBQUNhLFNBQUwsRUFBZ0I7QUFDWkEsTUFB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QUFDQSxRQUFJekIsS0FBSyxLQUFLLEtBQUtwQyxZQUFuQixFQUFpQztBQUM3QixZQUFNbUUsT0FBTyxHQUFHLHdCQUNULEtBQUtuRSxZQUFMLEdBQW9CLG1DQUFwQixHQUEwRCxFQURqRCxLQUVUb0MsS0FBSyxDQUFDRixTQUFOLEdBQWtCRSxLQUFLLENBQUNGLFNBQXhCLEdBQW9DLEVBRjNCLENBQWhCOztBQUlBLFlBQU1vQyxNQUFNLGdCQUNSO0FBQUssUUFBQSxTQUFTLEVBQUVIO0FBQWhCLHNCQUNJO0FBQUssUUFBQSxTQUFTLEVBQUM7QUFBZixTQUNLL0IsS0FBSyxDQUFDSyxJQURYLENBREosZUFJSTtBQUFLLFFBQUEsU0FBUyxFQUFDLHNCQUFmO0FBQXNDLFFBQUEsT0FBTyxFQUFFLEtBQUt2QztBQUFwRCxRQUpKLENBREo7O0FBU0ErRCx3QkFBU0ksTUFBVCxDQUFnQkMsTUFBaEIsRUFBd0IsS0FBS2hFLG9CQUFMLEVBQXhCO0FBQ0gsS0FmRCxNQWVPO0FBQ0g7QUFDQTJELHdCQUFTQyxzQkFBVCxDQUFnQyxLQUFLNUQsb0JBQUwsRUFBaEM7QUFDSDtBQUNKOztBQWhTYzs7QUFtU25CLElBQUksQ0FBQ2lFLE1BQU0sQ0FBQ0MscUJBQVosRUFBbUM7QUFDL0JELEVBQUFBLE1BQU0sQ0FBQ0MscUJBQVAsR0FBK0IsSUFBSTVFLFlBQUosRUFBL0I7QUFDSDs7ZUFDYzJFLE1BQU0sQ0FBQ0MscUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUmVhY3RET00gZnJvbSAncmVhY3QtZG9tJztcbmltcG9ydCBBbmFseXRpY3MgZnJvbSAnLi9BbmFseXRpY3MnO1xuaW1wb3J0IGRpcyBmcm9tICcuL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQge2RlZmVyfSBmcm9tICcuL3V0aWxzL3Byb21pc2UnO1xuaW1wb3J0IEFzeW5jV3JhcHBlciBmcm9tICcuL0FzeW5jV3JhcHBlcic7XG5cbmNvbnN0IERJQUxPR19DT05UQUlORVJfSUQgPSBcIm14X0RpYWxvZ19Db250YWluZXJcIjtcbmNvbnN0IFNUQVRJQ19ESUFMT0dfQ09OVEFJTkVSX0lEID0gXCJteF9EaWFsb2dfU3RhdGljQ29udGFpbmVyXCI7XG5cbmNsYXNzIE1vZGFsTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX2NvdW50ZXIgPSAwO1xuXG4gICAgICAgIC8vIFRoZSBtb2RhbCB0byBwcmlvcml0aXNlIG92ZXIgYWxsIG90aGVycy4gSWYgdGhpcyBpcyBzZXQsIG9ubHkgc2hvd1xuICAgICAgICAvLyB0aGlzIG1vZGFsLiBSZW1vdmUgYWxsIG90aGVyIG1vZGFscyBmcm9tIHRoZSBzdGFjayB3aGVuIHRoaXMgbW9kYWxcbiAgICAgICAgLy8gaXMgY2xvc2VkLlxuICAgICAgICB0aGlzLl9wcmlvcml0eU1vZGFsID0gbnVsbDtcbiAgICAgICAgLy8gVGhlIG1vZGFsIHRvIGtlZXAgb3BlbiB1bmRlcm5lYXRoIG90aGVyIG1vZGFscyBpZiBwb3NzaWJsZS4gVXNlZnVsXG4gICAgICAgIC8vIGZvciBjYXNlcyBsaWtlIFNldHRpbmdzIHdoZXJlIHRoZSBtb2RhbCBzaG91bGQgcmVtYWluIG9wZW4gd2hpbGUgdGhlXG4gICAgICAgIC8vIHVzZXIgaXMgcHJvbXB0ZWQgZm9yIG1vcmUgaW5mb3JtYXRpb24vZXJyb3JzLlxuICAgICAgICB0aGlzLl9zdGF0aWNNb2RhbCA9IG51bGw7XG4gICAgICAgIC8vIEEgbGlzdCBvZiB0aGUgbW9kYWxzIHdlIGhhdmUgc3RhY2tlZCB1cCwgd2l0aCB0aGUgbW9zdCByZWNlbnQgYXQgWzBdXG4gICAgICAgIC8vIE5laXRoZXIgdGhlIHN0YXRpYyBub3IgcHJpb3JpdHkgbW9kYWwgd2lsbCBiZSBpbiB0aGlzIGxpc3QuXG4gICAgICAgIHRoaXMuX21vZGFscyA9IFtcbiAgICAgICAgICAgIC8qIHtcbiAgICAgICAgICAgICAgIGVsZW06IFJlYWN0IGNvbXBvbmVudCBmb3IgdGhpcyBkaWFsb2dcbiAgICAgICAgICAgICAgIG9uRmluaXNoZWQ6IGNhbGxlci1zdXBwbGllZCBvbkZpbmlzaGVkIGNhbGxiYWNrXG4gICAgICAgICAgICAgICBjbGFzc05hbWU6IENTUyBjbGFzcyBmb3IgdGhlIGRpYWxvZyB3cmFwcGVyIGRpdlxuICAgICAgICAgICAgICAgfSAqL1xuICAgICAgICBdO1xuXG4gICAgICAgIHRoaXMub25CYWNrZ3JvdW5kQ2xpY2sgPSB0aGlzLm9uQmFja2dyb3VuZENsaWNrLmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgaGFzRGlhbG9ncygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ByaW9yaXR5TW9kYWwgfHwgdGhpcy5fc3RhdGljTW9kYWwgfHwgdGhpcy5fbW9kYWxzLmxlbmd0aCA+IDA7XG4gICAgfVxuXG4gICAgZ2V0T3JDcmVhdGVDb250YWluZXIoKSB7XG4gICAgICAgIGxldCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChESUFMT0dfQ09OVEFJTkVSX0lEKTtcblxuICAgICAgICBpZiAoIWNvbnRhaW5lcikge1xuICAgICAgICAgICAgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5pZCA9IERJQUxPR19DT05UQUlORVJfSUQ7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgIH1cblxuICAgIGdldE9yQ3JlYXRlU3RhdGljQ29udGFpbmVyKCkge1xuICAgICAgICBsZXQgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoU1RBVElDX0RJQUxPR19DT05UQUlORVJfSUQpO1xuXG4gICAgICAgIGlmICghY29udGFpbmVyKSB7XG4gICAgICAgICAgICBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgY29udGFpbmVyLmlkID0gU1RBVElDX0RJQUxPR19DT05UQUlORVJfSUQ7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgIH1cblxuICAgIGNyZWF0ZVRyYWNrZWREaWFsb2coYW5hbHl0aWNzQWN0aW9uLCBhbmFseXRpY3NJbmZvLCAuLi5yZXN0KSB7XG4gICAgICAgIEFuYWx5dGljcy50cmFja0V2ZW50KCdNb2RhbCcsIGFuYWx5dGljc0FjdGlvbiwgYW5hbHl0aWNzSW5mbyk7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZURpYWxvZyguLi5yZXN0KTtcbiAgICB9XG5cbiAgICBhcHBlbmRUcmFja2VkRGlhbG9nKGFuYWx5dGljc0FjdGlvbiwgYW5hbHl0aWNzSW5mbywgLi4ucmVzdCkge1xuICAgICAgICBBbmFseXRpY3MudHJhY2tFdmVudCgnTW9kYWwnLCBhbmFseXRpY3NBY3Rpb24sIGFuYWx5dGljc0luZm8pO1xuICAgICAgICByZXR1cm4gdGhpcy5hcHBlbmREaWFsb2coLi4ucmVzdCk7XG4gICAgfVxuXG4gICAgY3JlYXRlRGlhbG9nKEVsZW1lbnQsIC4uLnJlc3QpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRGlhbG9nQXN5bmMoUHJvbWlzZS5yZXNvbHZlKEVsZW1lbnQpLCAuLi5yZXN0KTtcbiAgICB9XG5cbiAgICBhcHBlbmREaWFsb2coRWxlbWVudCwgLi4ucmVzdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcHBlbmREaWFsb2dBc3luYyhQcm9taXNlLnJlc29sdmUoRWxlbWVudCksIC4uLnJlc3QpO1xuICAgIH1cblxuICAgIGNyZWF0ZVRyYWNrZWREaWFsb2dBc3luYyhhbmFseXRpY3NBY3Rpb24sIGFuYWx5dGljc0luZm8sIC4uLnJlc3QpIHtcbiAgICAgICAgQW5hbHl0aWNzLnRyYWNrRXZlbnQoJ01vZGFsJywgYW5hbHl0aWNzQWN0aW9uLCBhbmFseXRpY3NJbmZvKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRGlhbG9nQXN5bmMoLi4ucmVzdCk7XG4gICAgfVxuXG4gICAgYXBwZW5kVHJhY2tlZERpYWxvZ0FzeW5jKGFuYWx5dGljc0FjdGlvbiwgYW5hbHl0aWNzSW5mbywgLi4ucmVzdCkge1xuICAgICAgICBBbmFseXRpY3MudHJhY2tFdmVudCgnTW9kYWwnLCBhbmFseXRpY3NBY3Rpb24sIGFuYWx5dGljc0luZm8pO1xuICAgICAgICByZXR1cm4gdGhpcy5hcHBlbmREaWFsb2dBc3luYyguLi5yZXN0KTtcbiAgICB9XG5cbiAgICBfYnVpbGRNb2RhbChwcm9tLCBwcm9wcywgY2xhc3NOYW1lLCBvcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IG1vZGFsID0ge307XG5cbiAgICAgICAgLy8gbmV2ZXIgY2FsbCB0aGlzIGZyb20gb25GaW5pc2hlZCgpIG90aGVyd2lzZSBpdCB3aWxsIGxvb3BcbiAgICAgICAgY29uc3QgW2Nsb3NlRGlhbG9nLCBvbkZpbmlzaGVkUHJvbV0gPSB0aGlzLl9nZXRDbG9zZUZuKG1vZGFsLCBwcm9wcyk7XG5cbiAgICAgICAgLy8gZG9uJ3QgYXR0ZW1wdCB0byByZXVzZSB0aGUgc2FtZSBBc3luY1dyYXBwZXIgZm9yIGRpZmZlcmVudCBkaWFsb2dzLFxuICAgICAgICAvLyBvdGhlcndpc2Ugd2UnbGwgZ2V0IGNvbmZ1c2VkLlxuICAgICAgICBjb25zdCBtb2RhbENvdW50ID0gdGhpcy5fY291bnRlcisrO1xuXG4gICAgICAgIC8vIEZJWE1FOiBJZiBhIGRpYWxvZyB1c2VzIGdldERlZmF1bHRQcm9wcyBpdCBjbG9iYmVycyB0aGUgb25GaW5pc2hlZFxuICAgICAgICAvLyBwcm9wZXJ0eSBzZXQgaGVyZSBzbyB5b3UgY2FuJ3QgY2xvc2UgdGhlIGRpYWxvZyBmcm9tIGEgYnV0dG9uIGNsaWNrIVxuICAgICAgICBtb2RhbC5lbGVtID0gKFxuICAgICAgICAgICAgPEFzeW5jV3JhcHBlciBrZXk9e21vZGFsQ291bnR9IHByb209e3Byb219IHsuLi5wcm9wc31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25GaW5pc2hlZD17Y2xvc2VEaWFsb2d9IC8+XG4gICAgICAgICk7XG4gICAgICAgIG1vZGFsLm9uRmluaXNoZWQgPSBwcm9wcyA/IHByb3BzLm9uRmluaXNoZWQgOiBudWxsO1xuICAgICAgICBtb2RhbC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gICAgICAgIG1vZGFsLm9uQmVmb3JlQ2xvc2UgPSBvcHRpb25zLm9uQmVmb3JlQ2xvc2U7XG4gICAgICAgIG1vZGFsLmJlZm9yZUNsb3NlUHJvbWlzZSA9IG51bGw7XG4gICAgICAgIG1vZGFsLmNsb3NlID0gY2xvc2VEaWFsb2c7XG4gICAgICAgIG1vZGFsLmNsb3NlUmVhc29uID0gbnVsbDtcblxuICAgICAgICByZXR1cm4ge21vZGFsLCBjbG9zZURpYWxvZywgb25GaW5pc2hlZFByb219O1xuICAgIH1cblxuICAgIF9nZXRDbG9zZUZuKG1vZGFsLCBwcm9wcykge1xuICAgICAgICBjb25zdCBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIHJldHVybiBbYXN5bmMgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgIGlmIChtb2RhbC5iZWZvcmVDbG9zZVByb21pc2UpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBtb2RhbC5iZWZvcmVDbG9zZVByb21pc2U7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1vZGFsLm9uQmVmb3JlQ2xvc2UpIHtcbiAgICAgICAgICAgICAgICBtb2RhbC5iZWZvcmVDbG9zZVByb21pc2UgPSBtb2RhbC5vbkJlZm9yZUNsb3NlKG1vZGFsLmNsb3NlUmVhc29uKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzaG91bGRDbG9zZSA9IGF3YWl0IG1vZGFsLmJlZm9yZUNsb3NlUHJvbWlzZTtcbiAgICAgICAgICAgICAgICBtb2RhbC5iZWZvcmVDbG9zZVByb21pc2UgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmICghc2hvdWxkQ2xvc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoYXJncyk7XG4gICAgICAgICAgICBpZiAocHJvcHMgJiYgcHJvcHMub25GaW5pc2hlZCkgcHJvcHMub25GaW5pc2hlZC5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgIGNvbnN0IGkgPSB0aGlzLl9tb2RhbHMuaW5kZXhPZihtb2RhbCk7XG4gICAgICAgICAgICBpZiAoaSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbW9kYWxzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuX3ByaW9yaXR5TW9kYWwgPT09IG1vZGFsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJpb3JpdHlNb2RhbCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAvLyBYWFg6IFRoaXMgaXMgZGVzdHJ1Y3RpdmVcbiAgICAgICAgICAgICAgICB0aGlzLl9tb2RhbHMgPSBbXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXRpY01vZGFsID09PSBtb2RhbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXRpY01vZGFsID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIC8vIFhYWDogVGhpcyBpcyBkZXN0cnVjdGl2ZVxuICAgICAgICAgICAgICAgIHRoaXMuX21vZGFscyA9IFtdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9yZVJlbmRlcigpO1xuICAgICAgICB9LCBkZWZlcnJlZC5wcm9taXNlXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAY2FsbGJhY2sgb25CZWZvcmVDbG9zZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nP30gcmVhc29uIGVpdGhlciBcImJhY2tncm91bmRDbGlja1wiIG9yIG51bGxcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2w+fSB3aGV0aGVyIHRoZSBkaWFsb2cgc2hvdWxkIGNsb3NlXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBPcGVuIGEgbW9kYWwgdmlldy5cbiAgICAgKlxuICAgICAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gZGlzcGxheSBhIHJlYWN0IGNvbXBvbmVudCB3aGljaCBpcyBsb2FkZWQgYXMgYW4gYXN5bmNocm9ub3VzXG4gICAgICogd2VicGFjayBjb21wb25lbnQuIFRvIGRvIHRoaXMsIHNldCAnbG9hZGVyJyBhczpcbiAgICAgKlxuICAgICAqICAgKGNiKSA9PiB7XG4gICAgICogICAgICAgcmVxdWlyZShbJzxtb2R1bGU+J10sIGNiKTtcbiAgICAgKiAgIH1cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UHJvbWlzZX0gcHJvbSAgIGEgcHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aXRoIGEgUmVhY3QgY29tcG9uZW50XG4gICAgICogICB3aGljaCB3aWxsIGJlIGRpc3BsYXllZCBhcyB0aGUgbW9kYWwgdmlldy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAgIHByb3BlcnRpZXMgdG8gcGFzcyB0byB0aGUgZGlzcGxheWVkXG4gICAgICogICAgY29tcG9uZW50LiAoV2Ugd2lsbCBhbHNvIHBhc3MgYW4gJ29uRmluaXNoZWQnIHByb3BlcnR5LilcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjbGFzc05hbWUgICBDU1MgY2xhc3MgdG8gYXBwbHkgdG8gdGhlIG1vZGFsIHdyYXBwZXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNQcmlvcml0eU1vZGFsIGlmIHRydWUsIHRoaXMgbW9kYWwgd2lsbCBiZSBkaXNwbGF5ZWQgcmVnYXJkbGVzc1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mIG90aGVyIG1vZGFscyB0aGF0IGFyZSBjdXJyZW50bHkgaW4gdGhlIHN0YWNrLlxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsc28sIHdoZW4gY2xvc2VkLCBhbGwgbW9kYWxzIHdpbGwgYmUgcmVtb3ZlZFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb20gdGhlIHN0YWNrLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNTdGF0aWNNb2RhbCAgaWYgdHJ1ZSwgdGhpcyBtb2RhbCB3aWxsIGJlIGRpc3BsYXllZCB1bmRlciBvdGhlclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWxzIGluIHRoZSBzdGFjay4gV2hlbiBjbG9zZWQsIGFsbCBtb2RhbHMgd2lsbFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxzbyBiZSByZW1vdmVkIGZyb20gdGhlIHN0YWNrLiBUaGlzIGlzIG5vdCBjb21wYXRpYmxlXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRoIGJlaW5nIGEgcHJpb3JpdHkgbW9kYWwuIE9ubHkgb25lIG1vZGFsIGNhbiBiZVxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGljIGF0IGEgdGltZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucz8gZXh0cmEgb3B0aW9ucyBmb3IgdGhlIGRpYWxvZ1xuICAgICAqIEBwYXJhbSB7b25CZWZvcmVDbG9zZX0gb3B0aW9ucy5vbkJlZm9yZUNsb3NlIGEgY2FsbGJhY2sgdG8gZGVjaWRlIHdoZXRoZXIgdG8gY2xvc2UgdGhlIGRpYWxvZ1xuICAgICAqIEByZXR1cm5zIHtvYmplY3R9IE9iamVjdCB3aXRoICdjbG9zZScgcGFyYW1ldGVyIGJlaW5nIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGNsb3NlIHRoZSBkaWFsb2dcbiAgICAgKi9cbiAgICBjcmVhdGVEaWFsb2dBc3luYyhwcm9tLCBwcm9wcywgY2xhc3NOYW1lLCBpc1ByaW9yaXR5TW9kYWwsIGlzU3RhdGljTW9kYWwsIG9wdGlvbnMgPSB7fSkge1xuICAgICAgICBjb25zdCB7bW9kYWwsIGNsb3NlRGlhbG9nLCBvbkZpbmlzaGVkUHJvbX0gPSB0aGlzLl9idWlsZE1vZGFsKHByb20sIHByb3BzLCBjbGFzc05hbWUsIG9wdGlvbnMpO1xuICAgICAgICBpZiAoaXNQcmlvcml0eU1vZGFsKSB7XG4gICAgICAgICAgICAvLyBYWFg6IFRoaXMgaXMgZGVzdHJ1Y3RpdmVcbiAgICAgICAgICAgIHRoaXMuX3ByaW9yaXR5TW9kYWwgPSBtb2RhbDtcbiAgICAgICAgfSBlbHNlIGlmIChpc1N0YXRpY01vZGFsKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGludGVudGlvbmFsbHkgZGVzdHJ1Y3RpdmVcbiAgICAgICAgICAgIHRoaXMuX3N0YXRpY01vZGFsID0gbW9kYWw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9tb2RhbHMudW5zaGlmdChtb2RhbCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9yZVJlbmRlcigpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY2xvc2U6IGNsb3NlRGlhbG9nLFxuICAgICAgICAgICAgZmluaXNoZWQ6IG9uRmluaXNoZWRQcm9tLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFwcGVuZERpYWxvZ0FzeW5jKHByb20sIHByb3BzLCBjbGFzc05hbWUpIHtcbiAgICAgICAgY29uc3Qge21vZGFsLCBjbG9zZURpYWxvZywgb25GaW5pc2hlZFByb219ID0gdGhpcy5fYnVpbGRNb2RhbChwcm9tLCBwcm9wcywgY2xhc3NOYW1lLCB7fSk7XG5cbiAgICAgICAgdGhpcy5fbW9kYWxzLnB1c2gobW9kYWwpO1xuICAgICAgICB0aGlzLl9yZVJlbmRlcigpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY2xvc2U6IGNsb3NlRGlhbG9nLFxuICAgICAgICAgICAgZmluaXNoZWQ6IG9uRmluaXNoZWRQcm9tLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIG9uQmFja2dyb3VuZENsaWNrKCkge1xuICAgICAgICBjb25zdCBtb2RhbCA9IHRoaXMuX2dldEN1cnJlbnRNb2RhbCgpO1xuICAgICAgICBpZiAoIW1vZGFsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gd2Ugd2FudCB0byBwYXNzIGEgcmVhc29uIHRvIHRoZSBvbkJlZm9yZUNsb3NlXG4gICAgICAgIC8vIGNhbGxiYWNrLCBidXQgY2xvc2UgaXMgY3VycmVudGx5IGRlZmluZWQgdG9cbiAgICAgICAgLy8gcGFzcyBhbGwgbnVtYmVyIG9mIGFyZ3VtZW50cyB0byB0aGUgb25GaW5pc2hlZCBjYWxsYmFja1xuICAgICAgICAvLyBzbywgcGFzcyB0aGUgcmVhc29uIHRvIGNsb3NlIHRocm91Z2ggYSBtZW1iZXIgdmFyaWFibGVcbiAgICAgICAgbW9kYWwuY2xvc2VSZWFzb24gPSBcImJhY2tncm91bmRDbGlja1wiO1xuICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICBtb2RhbC5jbG9zZVJlYXNvbiA9IG51bGw7XG4gICAgfVxuXG4gICAgX2dldEN1cnJlbnRNb2RhbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ByaW9yaXR5TW9kYWwgPyB0aGlzLl9wcmlvcml0eU1vZGFsIDogKHRoaXMuX21vZGFsc1swXSB8fCB0aGlzLl9zdGF0aWNNb2RhbCk7XG4gICAgfVxuXG4gICAgX3JlUmVuZGVyKCkge1xuICAgICAgICBpZiAodGhpcy5fbW9kYWxzLmxlbmd0aCA9PT0gMCAmJiAhdGhpcy5fcHJpb3JpdHlNb2RhbCAmJiAhdGhpcy5fc3RhdGljTW9kYWwpIHtcbiAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIG5vIG1vZGFsIHRvIHJlbmRlciwgbWFrZSBhbGwgb2YgUmlvdCBhdmFpbGFibGVcbiAgICAgICAgICAgIC8vIHRvIHNjcmVlbiByZWFkZXIgdXNlcnMgYWdhaW5cbiAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnYXJpYV91bmhpZGVfbWFpbl9hcHAnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBSZWFjdERPTS51bm1vdW50Q29tcG9uZW50QXROb2RlKHRoaXMuZ2V0T3JDcmVhdGVDb250YWluZXIoKSk7XG4gICAgICAgICAgICBSZWFjdERPTS51bm1vdW50Q29tcG9uZW50QXROb2RlKHRoaXMuZ2V0T3JDcmVhdGVTdGF0aWNDb250YWluZXIoKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIaWRlIHRoZSBjb250ZW50IG91dHNpZGUgdGhlIG1vZGFsIHRvIHNjcmVlbiByZWFkZXIgdXNlcnNcbiAgICAgICAgLy8gc28gdGhleSB3b24ndCBiZSBhYmxlIHRvIG5hdmlnYXRlIGludG8gaXQgYW5kIGFjdCBvbiBpdCB1c2luZ1xuICAgICAgICAvLyBzY3JlZW4gcmVhZGVyIHNwZWNpZmljIGZlYXR1cmVzXG4gICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246ICdhcmlhX2hpZGVfbWFpbl9hcHAnLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodGhpcy5fc3RhdGljTW9kYWwpIHtcbiAgICAgICAgICAgIGNvbnN0IGNsYXNzZXMgPSBcIm14X0RpYWxvZ193cmFwcGVyIG14X0RpYWxvZ19zdGF0aWNXcmFwcGVyIFwiXG4gICAgICAgICAgICAgICAgKyAodGhpcy5fc3RhdGljTW9kYWwuY2xhc3NOYW1lID8gdGhpcy5fc3RhdGljTW9kYWwuY2xhc3NOYW1lIDogJycpO1xuXG4gICAgICAgICAgICBjb25zdCBzdGF0aWNEaWFsb2cgPSAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzZXN9PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RpYWxvZ1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyB0aGlzLl9zdGF0aWNNb2RhbC5lbGVtIH1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGlhbG9nX2JhY2tncm91bmQgbXhfRGlhbG9nX3N0YXRpY0JhY2tncm91bmRcIiBvbkNsaWNrPXt0aGlzLm9uQmFja2dyb3VuZENsaWNrfT48L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIFJlYWN0RE9NLnJlbmRlcihzdGF0aWNEaWFsb2csIHRoaXMuZ2V0T3JDcmVhdGVTdGF0aWNDb250YWluZXIoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIHNhZmUgdG8gY2FsbCByZXBlYXRlZGx5IGlmIHdlIGhhcHBlbiB0byBkbyB0aGF0XG4gICAgICAgICAgICBSZWFjdERPTS51bm1vdW50Q29tcG9uZW50QXROb2RlKHRoaXMuZ2V0T3JDcmVhdGVTdGF0aWNDb250YWluZXIoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtb2RhbCA9IHRoaXMuX2dldEN1cnJlbnRNb2RhbCgpO1xuICAgICAgICBpZiAobW9kYWwgIT09IHRoaXMuX3N0YXRpY01vZGFsKSB7XG4gICAgICAgICAgICBjb25zdCBjbGFzc2VzID0gXCJteF9EaWFsb2dfd3JhcHBlciBcIlxuICAgICAgICAgICAgICAgICsgKHRoaXMuX3N0YXRpY01vZGFsID8gXCJteF9EaWFsb2dfd3JhcHBlcldpdGhTdGF0aWNVbmRlciBcIiA6ICcnKVxuICAgICAgICAgICAgICAgICsgKG1vZGFsLmNsYXNzTmFtZSA/IG1vZGFsLmNsYXNzTmFtZSA6ICcnKTtcblxuICAgICAgICAgICAgY29uc3QgZGlhbG9nID0gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtjbGFzc2VzfT5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EaWFsb2dcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHttb2RhbC5lbGVtfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EaWFsb2dfYmFja2dyb3VuZFwiIG9uQ2xpY2s9e3RoaXMub25CYWNrZ3JvdW5kQ2xpY2t9PjwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgUmVhY3RET00ucmVuZGVyKGRpYWxvZywgdGhpcy5nZXRPckNyZWF0ZUNvbnRhaW5lcigpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgc2FmZSB0byBjYWxsIHJlcGVhdGVkbHkgaWYgd2UgaGFwcGVuIHRvIGRvIHRoYXRcbiAgICAgICAgICAgIFJlYWN0RE9NLnVubW91bnRDb21wb25lbnRBdE5vZGUodGhpcy5nZXRPckNyZWF0ZUNvbnRhaW5lcigpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuaWYgKCFnbG9iYWwuc2luZ2xldG9uTW9kYWxNYW5hZ2VyKSB7XG4gICAgZ2xvYmFsLnNpbmdsZXRvbk1vZGFsTWFuYWdlciA9IG5ldyBNb2RhbE1hbmFnZXIoKTtcbn1cbmV4cG9ydCBkZWZhdWx0IGdsb2JhbC5zaW5nbGV0b25Nb2RhbE1hbmFnZXI7XG4iXX0=