"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _dispatcher = _interopRequireDefault(require("../dispatcher/dispatcher"));

var _utils = require("flux/utils");

/*
Copyright 2017 Vector Creations Ltd
Copyright 2018 New Vector Ltd
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
const INITIAL_STATE = {
  deferred_action: null
};
/**
 * A class for storing application state to do with authentication. This is a simple flux
 * store that listens for actions and updates its state accordingly, informing any
 * listeners (views) of state changes.
 */

class LifecycleStore extends _utils.Store {
  constructor() {
    super(_dispatcher.default); // Initialise state

    this._state = INITIAL_STATE;
  }

  _setState(newState) {
    this._state = Object.assign(this._state, newState);

    this.__emitChange();
  }

  __onDispatch(payload) {
    switch (payload.action) {
      case 'do_after_sync_prepared':
        this._setState({
          deferred_action: payload.deferred_action
        });

        break;

      case 'cancel_after_sync_prepared':
        this._setState({
          deferred_action: null
        });

        break;

      case 'sync_state':
        {
          if (payload.state !== 'PREPARED') {
            break;
          }

          if (!this._state.deferred_action) break;
          const deferredAction = Object.assign({}, this._state.deferred_action);

          this._setState({
            deferred_action: null
          });

          _dispatcher.default.dispatch(deferredAction);

          break;
        }

      case 'on_client_not_viable':
      case 'on_logged_out':
        this.reset();
        break;
    }
  }

  reset() {
    this._state = Object.assign({}, INITIAL_STATE);
  }

}

let singletonLifecycleStore = null;

if (!singletonLifecycleStore) {
  singletonLifecycleStore = new LifecycleStore();
}

var _default = singletonLifecycleStore;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdG9yZXMvTGlmZWN5Y2xlU3RvcmUuanMiXSwibmFtZXMiOlsiSU5JVElBTF9TVEFURSIsImRlZmVycmVkX2FjdGlvbiIsIkxpZmVjeWNsZVN0b3JlIiwiU3RvcmUiLCJjb25zdHJ1Y3RvciIsImRpcyIsIl9zdGF0ZSIsIl9zZXRTdGF0ZSIsIm5ld1N0YXRlIiwiT2JqZWN0IiwiYXNzaWduIiwiX19lbWl0Q2hhbmdlIiwiX19vbkRpc3BhdGNoIiwicGF5bG9hZCIsImFjdGlvbiIsInN0YXRlIiwiZGVmZXJyZWRBY3Rpb24iLCJkaXNwYXRjaCIsInJlc2V0Iiwic2luZ2xldG9uTGlmZWN5Y2xlU3RvcmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFsQkE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JBLE1BQU1BLGFBQWEsR0FBRztBQUNsQkMsRUFBQUEsZUFBZSxFQUFFO0FBREMsQ0FBdEI7QUFJQTs7Ozs7O0FBS0EsTUFBTUMsY0FBTixTQUE2QkMsWUFBN0IsQ0FBbUM7QUFDL0JDLEVBQUFBLFdBQVcsR0FBRztBQUNWLFVBQU1DLG1CQUFOLEVBRFUsQ0FHVjs7QUFDQSxTQUFLQyxNQUFMLEdBQWNOLGFBQWQ7QUFDSDs7QUFFRE8sRUFBQUEsU0FBUyxDQUFDQyxRQUFELEVBQVc7QUFDaEIsU0FBS0YsTUFBTCxHQUFjRyxNQUFNLENBQUNDLE1BQVAsQ0FBYyxLQUFLSixNQUFuQixFQUEyQkUsUUFBM0IsQ0FBZDs7QUFDQSxTQUFLRyxZQUFMO0FBQ0g7O0FBRURDLEVBQUFBLFlBQVksQ0FBQ0MsT0FBRCxFQUFVO0FBQ2xCLFlBQVFBLE9BQU8sQ0FBQ0MsTUFBaEI7QUFDSSxXQUFLLHdCQUFMO0FBQ0ksYUFBS1AsU0FBTCxDQUFlO0FBQ1hOLFVBQUFBLGVBQWUsRUFBRVksT0FBTyxDQUFDWjtBQURkLFNBQWY7O0FBR0E7O0FBQ0osV0FBSyw0QkFBTDtBQUNJLGFBQUtNLFNBQUwsQ0FBZTtBQUNYTixVQUFBQSxlQUFlLEVBQUU7QUFETixTQUFmOztBQUdBOztBQUNKLFdBQUssWUFBTDtBQUFtQjtBQUNmLGNBQUlZLE9BQU8sQ0FBQ0UsS0FBUixLQUFrQixVQUF0QixFQUFrQztBQUM5QjtBQUNIOztBQUNELGNBQUksQ0FBQyxLQUFLVCxNQUFMLENBQVlMLGVBQWpCLEVBQWtDO0FBQ2xDLGdCQUFNZSxjQUFjLEdBQUdQLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjLEVBQWQsRUFBa0IsS0FBS0osTUFBTCxDQUFZTCxlQUE5QixDQUF2Qjs7QUFDQSxlQUFLTSxTQUFMLENBQWU7QUFDWE4sWUFBQUEsZUFBZSxFQUFFO0FBRE4sV0FBZjs7QUFHQUksOEJBQUlZLFFBQUosQ0FBYUQsY0FBYjs7QUFDQTtBQUNIOztBQUNELFdBQUssc0JBQUw7QUFDQSxXQUFLLGVBQUw7QUFDSSxhQUFLRSxLQUFMO0FBQ0E7QUExQlI7QUE0Qkg7O0FBRURBLEVBQUFBLEtBQUssR0FBRztBQUNKLFNBQUtaLE1BQUwsR0FBY0csTUFBTSxDQUFDQyxNQUFQLENBQWMsRUFBZCxFQUFrQlYsYUFBbEIsQ0FBZDtBQUNIOztBQTlDOEI7O0FBaURuQyxJQUFJbUIsdUJBQXVCLEdBQUcsSUFBOUI7O0FBQ0EsSUFBSSxDQUFDQSx1QkFBTCxFQUE4QjtBQUMxQkEsRUFBQUEsdUJBQXVCLEdBQUcsSUFBSWpCLGNBQUosRUFBMUI7QUFDSDs7ZUFDY2lCLHVCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5Db3B5cmlnaHQgMjAxOCBOZXcgVmVjdG9yIEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuaW1wb3J0IGRpcyBmcm9tICcuLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXInO1xuaW1wb3J0IHtTdG9yZX0gZnJvbSAnZmx1eC91dGlscyc7XG5cbmNvbnN0IElOSVRJQUxfU1RBVEUgPSB7XG4gICAgZGVmZXJyZWRfYWN0aW9uOiBudWxsLFxufTtcblxuLyoqXG4gKiBBIGNsYXNzIGZvciBzdG9yaW5nIGFwcGxpY2F0aW9uIHN0YXRlIHRvIGRvIHdpdGggYXV0aGVudGljYXRpb24uIFRoaXMgaXMgYSBzaW1wbGUgZmx1eFxuICogc3RvcmUgdGhhdCBsaXN0ZW5zIGZvciBhY3Rpb25zIGFuZCB1cGRhdGVzIGl0cyBzdGF0ZSBhY2NvcmRpbmdseSwgaW5mb3JtaW5nIGFueVxuICogbGlzdGVuZXJzICh2aWV3cykgb2Ygc3RhdGUgY2hhbmdlcy5cbiAqL1xuY2xhc3MgTGlmZWN5Y2xlU3RvcmUgZXh0ZW5kcyBTdG9yZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKGRpcyk7XG5cbiAgICAgICAgLy8gSW5pdGlhbGlzZSBzdGF0ZVxuICAgICAgICB0aGlzLl9zdGF0ZSA9IElOSVRJQUxfU1RBVEU7XG4gICAgfVxuXG4gICAgX3NldFN0YXRlKG5ld1N0YXRlKSB7XG4gICAgICAgIHRoaXMuX3N0YXRlID0gT2JqZWN0LmFzc2lnbih0aGlzLl9zdGF0ZSwgbmV3U3RhdGUpO1xuICAgICAgICB0aGlzLl9fZW1pdENoYW5nZSgpO1xuICAgIH1cblxuICAgIF9fb25EaXNwYXRjaChwYXlsb2FkKSB7XG4gICAgICAgIHN3aXRjaCAocGF5bG9hZC5hY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgJ2RvX2FmdGVyX3N5bmNfcHJlcGFyZWQnOlxuICAgICAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWRfYWN0aW9uOiBwYXlsb2FkLmRlZmVycmVkX2FjdGlvbixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2NhbmNlbF9hZnRlcl9zeW5jX3ByZXBhcmVkJzpcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkX2FjdGlvbjogbnVsbCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3N5bmNfc3RhdGUnOiB7XG4gICAgICAgICAgICAgICAgaWYgKHBheWxvYWQuc3RhdGUgIT09ICdQUkVQQVJFRCcpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fc3RhdGUuZGVmZXJyZWRfYWN0aW9uKSBicmVhaztcbiAgICAgICAgICAgICAgICBjb25zdCBkZWZlcnJlZEFjdGlvbiA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuX3N0YXRlLmRlZmVycmVkX2FjdGlvbik7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZF9hY3Rpb246IG51bGwsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKGRlZmVycmVkQWN0aW9uKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ29uX2NsaWVudF9ub3RfdmlhYmxlJzpcbiAgICAgICAgICAgIGNhc2UgJ29uX2xvZ2dlZF9vdXQnOlxuICAgICAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIElOSVRJQUxfU1RBVEUpO1xuICAgIH1cbn1cblxubGV0IHNpbmdsZXRvbkxpZmVjeWNsZVN0b3JlID0gbnVsbDtcbmlmICghc2luZ2xldG9uTGlmZWN5Y2xlU3RvcmUpIHtcbiAgICBzaW5nbGV0b25MaWZlY3ljbGVTdG9yZSA9IG5ldyBMaWZlY3ljbGVTdG9yZSgpO1xufVxuZXhwb3J0IGRlZmF1bHQgc2luZ2xldG9uTGlmZWN5Y2xlU3RvcmU7XG4iXX0=